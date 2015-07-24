// Copyright 2014 Rackspace
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
(function() {
  'use strict';

  angular
    .module('hotbuilder')
    .factory('ModelsService', ModelsService);

  ModelsService.$inject = ['merlin.field.models', 'merlin.utils'];

  function ModelsService(fields, utils) {
    var hot = {};

    var elementSchema,
      rpElementSchema,
      primitiveExtension = {
        create: function (json, parameters) {
          var self = Barricade.Primitive.create.call(this, json,
            parameters);
          hot.Primitive.call(self);
          return self;
        }
      };

    hot.Primitive = Barricade.Blueprint.create(function () {});

    hot.Primitive._schema = {}; // QUICK HACK

    hot.Primitive.Factory = function (json, parameters) {
      var type = Barricade.getType(json);

      if (json === undefined || type === String) {
        return hot.Primitive.string.create(json, parameters);
      } else if (type === Boolean) {
        return hot.Primitive.bool.create(json, parameters);
      } else if (type === Number) {
        return hot.Primitive.number.create(json, parameters);
      } else if (type === Array) {
        return hot.Primitive.array.create(json, parameters);
      } else if (type === Object) {
        return hot.Primitive.object.create(json, parameters);
      }
    };

    elementSchema = {
      '@class': hot.Primitive,
      '@factory': hot.Primitive.Factory
    };

    hot.Primitive.string = Barricade.Primitive.extend(primitiveExtension,
      {'@type': String});
    hot.Primitive.bool = Barricade.Primitive.extend(primitiveExtension,
      {'@type': Boolean});
    hot.Primitive.number = Barricade.Primitive.extend(primitiveExtension,
      {'@type': Number});
    hot.Primitive.array = Barricade.Array.extend({
      create: function (json, parameters) {
        var self = Barricade.Array.create.call(this, json, parameters);
        hot.Primitive.call(self);
        return self;
      }
    }, {
      '@type': Array,
      '*': elementSchema
    });

    hot.Primitive.object = Barricade.MutableObject.extend({
      create: function (json, parameters) {
        var self = Barricade.MutableObject
          .create.call(this, json, parameters);
        hot.Primitive.call(self);
        return self;
      }
    }, {
      '@type': Object,
      '?': elementSchema
    });

    hot.ResourcePropertyWrapper = Barricade.Base.extend({
      create: function (json, parameters) {
        var self = this.extend({}),
          value = hot.IntrinsicFunctionFactory(json, parameters);

        if (!parameters) {
          parameters = {};
        }

        Barricade.Observable.call(self);
        Barricade.Identifiable.call(self, parameters.id);

        if (value) {
          self.setValue(value);
        } else {
          self.setValue(json, parameters);
        }

        return self;
      },
      getValue: function () {
        return this._value;
      },
      setValue: function (newValue, newParameters) {
        var self = this;

        function onChange() { self.emit('change', this); }
        function onChildChange() { self.emit('childChange', this); }
        function onReplace(newVal) { self.setValue(newVal); }

        if (this._value) {
          this._value.emit('removeFrom', this);
        }

        if (this._safeInstanceof(newValue, hot.IntrinsicFunction) ||
          this._safeInstanceof(newValue, this._innerClass)) {
          this._value = newValue;
        } else {
          this._value = this._innerClass.create(newValue,
            newParameters);
        }

        this._value.on('change', onChange);
        this._value.on('childChange', onChildChange);
        this._value.on('replace', onReplace);

        this._value.on('removeFrom', function (container) {
          self._value.off('change', onChange);
          self._value.off('childChange', onChildChange);
          self._value.off('replace', onReplace);
        });

        this.emit('change', 'set', this._value);
      },
      toNormal: function () {
        this.setValue();
      },
      toIntrinsicFunction: function () {
        this.setValue(hot.GetParameter.create());
      },
      hasDescription: function () {
        return ('_description' in this) && !this._description.isEmpty();
      },
      getDescription: function () {
        return this._description.get();
      },
      hasDependency: function () {
        return this._value.hasDependency();
      },
      resolveWith: function (obj) {
        return this.getValue().resolveWith(obj);
      },
      isEmpty: function () {
        return !!this._value;
      },
      isUsed: function () {
        return this.isRequired() || this._value.isUsed();
      },
      setIsUsed: function (isUsed) {
        return this._value.setIsUsed(isUsed);
      },
      getIntrinsicFunctions: function () {
        function searchValue(value) {
          var intrinsics = [];
          if (value.instanceof(hot.ResourcePropertyWrapper)) {
            return value.getIntrinsicFunctions();
          } else if (value.instanceof(hot.IntrinsicFunction)) {
            if (value.instanceof(hot.StringReplace)) {
              return [value].concat(value.getIntrinsicFunctions());
            }
            return [value];
          } else if (value.instanceof(Barricade.Container)) {
            value.each(function (i, element) {
              intrinsics = intrinsics.concat(searchValue(element));
            });
            return intrinsics;
          }
          return [];
        }
        return searchValue(this.getValue());
      },
      toJSON: function (options) {
        return this._value.toJSON(options);
      }
    });

    // Extension for Resource properties that have schemaless containers
    hot.Primitive.FactoryForResourceProperty = function (json, parameters) {
      var type = Barricade.getType(json);

      function getInnerClass() {
        if (json === undefined || type === String) {
          return hot.Primitive.string;
        } else if (type === Boolean) {
          return hot.Primitive.bool;
        } else if (type === Number) {
          return hot.Primitive.number;
        } else if (type === Array) {
          return hot.Primitive.arrayOfRP;
        } else if (type === Object) {
          return hot.Primitive.objectOfRP;
        }
      }

      return hot.ResourcePropertyWrapper.extend({
        _innerClass: getInnerClass()
      }, {}).create(json, parameters);
    };

    rpElementSchema = {
      '@class': hot.ResourcePropertyWrapper,
      '@factory': hot.Primitive.FactoryForResourceProperty
    };

    hot.Primitive.arrayOfRP = hot.Primitive.array.extend({}, {
      '*': rpElementSchema
    });

    hot.Primitive.objectOfRP = hot.Primitive.object.extend({}, {
      '?': rpElementSchema
    });

    function constraintFactory(constraintObj) {
      var types = {
        'range': function (constraint) {
          var min = constraint.min,
            max = constraint.max;

          function getMessage() {
            if (min === undefined) {
              return 'Value must be less than ' + max;
            } else if (max === undefined) {
              return 'Value must be greater than ' + min;
            }
            return 'Value must be between ' +
              min + ' and ' + max;
          }

          return function (val) {
            return ((min === undefined || val >= min) &&
              (max === undefined || val <= max)) ||
              getMessage();
          };
        },
        'length': function (constraint) {
          var min = constraint.min,
            max = constraint.max;

          function getMessage() {
            if (min === undefined) {
              return 'Must have fewer than ' +
                max + ' letters';
            } else if (max === undefined) {
              return 'Must have more than ' +
                min + ' letters';
            }
            return 'Must have between ' +
              min + ' and ' + max + ' letters';
          }

          return function (val) {
            return ((min === undefined || val.length >= min) &&
              (max === undefined || val.length <= max)) ||
              getMessage();
          };
        },
        'allowed_values': function (constraint) {
          return function (val) {
            return (constraint.indexOf(val) > -1) ||
              ('Value must be one of ' + constraint.join(', '));
          };
        },
        'allowed_pattern': function (constraint) {
          var regex = new RegExp(constraint);
          return function (val) {
            return regex.test(val) ||
              ('Must match pattern: ' + constraint);
          };
        },
        'custom_constraint': function () {
          return function () { return true; };
        }
      };

      for (var t in types) {
        if (constraintObj.hasOwnProperty(t)) {
          return types[t](constraintObj[t]);
        }
      }

      console.log('Constraint type not found: ', constraintObj);
      return function () { return true; };
    }

    hot.ResourcePropertyFactory = function (json, parameters) {
      if (!json.hasOwnProperty('schema')) {
        if (json.type === 'list') {
          return hot.ResourceProperty_list2.create(json, parameters);
        } else if (json.type === 'map') {
          return hot.ResourceProperty_map2.create(json, parameters);
        }
      }
      return hot['ResourceProperty_' + json.type].create(json, parameters);
    };

    hot.ResourceProperty = Barricade.ImmutableObject.extend({
      getSchema: function () {
        var schema = {},
          wrapperSchema = {},
          types = {
            'map': Object,
            'list': Array,
            'string': String,
            'number': Number,
            'integer': Number,
            'boolean': Boolean
          };

        wrapperSchema['@required'] = this.get('required').get();
        schema['@type'] = types[this.get('type').get()];
        schema['@required'] = this.get('required').get();
        schema['@constraints'] =
          this.get('constraints').get().map(constraintFactory);

        if (schema['@type'] === Object) {
          if (this.get('schema')) {
            this.get('schema').each(function (i, prop) {
              schema[prop.getID()] = prop.getSchema();
            });
          } else {
            schema['?'] = rpElementSchema;
          }
        } else if (schema['@type'] === Array) {
          if (this.get('schema')) {
            schema['*'] = this.get('schema').get('*').getSchema();
          } else {
            schema['*'] = rpElementSchema;
          }
        }

        return {
          '@class': hot.ResourcePropertyWrapper.extend({
            _innerClass: Barricade.create(schema),
            _description: this.get('description')
          }, wrapperSchema)
        };
      }
    }, {
      '@type': Object,
      'type': {'@type': String},
      'description': {'@type': String},
      'required': {'@type': Boolean},
      'constraints': {'@type': Array},
      'update_allowed': {'@type': Boolean}
    });

    hot.ResourceProperty_map = hot.ResourceProperty.extend({}, {
      'default': {'@type': Object},
      'schema': {
        '@type': Object,
        '?': {
          '@class': hot.ResourceProperty,
          '@factory': hot.ResourcePropertyFactory
        }
      }
    });

    hot.ResourceProperty_list = hot.ResourceProperty.extend({}, {
      'default': {'@type': Array},
      'schema': {
        '@type': Object,
        '*': {
          '@class': hot.ResourceProperty,
          '@factory': hot.ResourcePropertyFactory
        }
      }
    });

    hot.ResourceProperty_list2 = hot.ResourceProperty.extend({}, {
      'default': {'@type': Array}});
    hot.ResourceProperty_map2 = hot.ResourceProperty.extend({}, {
      'default': {'@type': Object}});
    hot.ResourceProperty_string = hot.ResourceProperty.extend({}, {
      'default': {'@type': String}});
    hot.ResourceProperty_number = hot.ResourceProperty.extend({}, {
      'default': {'@type': Number}});
    hot.ResourceProperty_integer = hot.ResourceProperty.extend({}, {
      'default': {'@type': Number}});
    hot.ResourceProperty_boolean = hot.ResourceProperty.extend({}, {
      'default': {'@type': Boolean}});

    hot.ResourceAttribute = Barricade.create({
      '@type': Object,
      'description': {'@type': String}
    });

    hot.ResourceType = Barricade.ImmutableObject.extend({
      getSchema: function () {
        var propertySchema = {
          '@type': Object,
          '@required': false
        };

        this.get('properties').each(function (i, self) {
          propertySchema[self.getID()] = self.getSchema();
        });

        if (this.getID() === 'OS::Heat::ResourceGroup') {
          propertySchema.resource_def = {
            '@type': Object,
            'type': {
              '@class': hot.ResourcePropertyWrapper.extend({
                _innerClass: Barricade.create({'@type': String})
              }, {'@required': true})
            },
            'properties': {
              '@type': Object,
              '@ref': {
                to: hot.ResourceProperties,
                needs: function () {
                  return hot.ResourceProperties;
                },
                getter: function (data) {
                  var type = data.needed.get('resource_def')
                    .get('type').getValue();
                  if (type.instanceof(hot.GetParameter)) {
                    type = type.get('get_param');
                  }
                  return type;
                },
                processor: function (data) {
                  var type = data.val;
                  if (type.instanceof(hot.Parameter)) {
                    type = type.get('default');
                  }
                  return hot.ResourcePropertiesFactory(
                    data.standIn.get(), undefined, type.get());
                }
              }
            }
          };
        }

        return propertySchema;
      }
    }, {
      '@type': Object,
      'attributes': {
        '@type': Object,
        '?': {'@class': hot.ResourceAttribute}
      },
      'properties': {
        '@type': Object,
        '?': {
          '@class': hot.ResourceProperty,
          '@factory': hot.ResourcePropertyFactory
        }
      }
    });

    hot.ResourceTypes = Barricade.create({
      '@type': Object,
      '?': {'@class': hot.ResourceType}
    });

    hot.IntrinsicFunctionFactory = function (json, parameters) {
      if (Barricade.getType(json) === Object) {
        if (json.hasOwnProperty('get_resource')) {
          return hot.GetResource.create(json, parameters);

        } else if (json.hasOwnProperty('get_attr')) {
          return hot.GetAttribute.create(json, parameters);

        } else if (json.hasOwnProperty('get_param')) {
          if (json.get_param === 'OS::stack_name' ||
            json.get_param === 'OS::stack_id' ||
            json.get_param === 'OS::project_id') {
            return hot.GetParameterSpecial.create(json, parameters);
          }
          return hot.GetParameter.create(json, parameters);

        } else if (json.hasOwnProperty('get_file')) {
          return hot.GetFile.create(json, parameters);

        } else if (json.hasOwnProperty('str_replace')) {
          return hot.StringReplace.create(json, parameters);

        } else if (json.hasOwnProperty('resource_facade')) {
          return hot.ResourceFacade.create(json, parameters);
        }
      }

      return false;
    };

    hot.IntrinsicFunction = Barricade.ImmutableObject.extend({}, {
      '@type': Object,
      '@required': false
    });

    hot.GetResource = hot.IntrinsicFunction.extend({}, {
      '@toJSON': function () {
        if (this.get('get_resource').getPrimitiveType() === String) {
          console.error('Resource was not available');
          return {get_resource: ''};
        } else {
          return {get_resource: this.get('get_resource').getID()};
        }
      },
      'get_resource': {
        '@type': String,
        '@ref': {
          to: function () { return hot.Resource; },
          needs: function () { return hot.Template; },
          getter: function (data) {
            return data.needed.get('resources')
              .getByID(data.standIn.get());
          }
        }
      }
    });

    hot.GetAttribute = hot.IntrinsicFunction.extend({}, {
      'get_attr': {
        // handle a nicely-formatted object instead of
        // an array with different types in it, the first
        // two of which should really be references
        '@type': Object,
        '@inputMassager': function (json) {
          if (!json) {
            json = ['', ''];
          }

          return {
            resource: json[0],
            attribute: json[1],
            value: json.slice(2)
          };
        },
        '@toJSON': function () {
          var resourceID;

          if (this.get('resource').getPrimitiveType() === String) {
            resourceID = '';
            console.error('Resource was not available');
          } else {
            resourceID = this.get('resource').getID();
          }
          return [
            resourceID,
            this.get('attribute').get()
          ].concat(this.get('value').get());
        },

        'resource': {
          '@type': String,
          '@ref': {
            to: function () { return hot.Resource; },
            needs: function () { return hot.Template; },
            getter: function (data) {
              return data.needed.get('resources')
                .getByID(data.standIn.get());
            }
          }
        },
        'attribute': {'@type': String},
        'value': {'@type': Array}
      }
    });

    hot.GetParameter = hot.IntrinsicFunction.extend({}, {
      '@toJSON': function () {
        if (this.get('get_param').getPrimitiveType() === String) {
          console.error('Parameter was not available');
          return {get_param: ''};
        } else {
          return {get_param: this.get('get_param').getID()};
        }
      },
      'get_param': {
        '@type': String,
        '@ref': {
          to: function () { return hot.Parameter; },
          needs: function () { return hot.Template; },
          getter: function (data) {
            return data.needed.get('parameters')
              .getByID(data.standIn.get());
          }
        }
      }
    });

    // For OS::stack_name, OS::stack_id, and OS::project_id pseudo parameters
    hot.GetParameterSpecial = hot.IntrinsicFunction.extend({}, {
      'get_param': {'@type': String}
    });

    hot.GetFile = hot.IntrinsicFunction.extend({}, {
      'get_file': {'@type': String}
    });

    hot.StringReplace = hot.IntrinsicFunction.extend({
      getParams: function () {
        return this.get('str_replace').get('params');
      },
      getTemplate: function () {
        return this.get('str_replace').get('template');
      },
      getIntrinsicFunctions: function () {
        return this.getParams().toArray().reduce(function (arr, current) {
          return arr.concat(current.getIntrinsicFunctions());
        }, []);
      }
    }, {
      'str_replace': {
        '@type': Object,
        'template': {'@type': String},
        'params': {
          '@type': Object,
          '?': {
            '@class': hot.ResourcePropertyWrapper.extend({
              _innerClass: Barricade.create({'@type': String})
            }, {})
          }
        }
      }
    });

    hot.ResourceFacade = hot.IntrinsicFunction.extend({}, {
      'resource_facade': {'@type': String}
    });

    hot.ResourceProperties = Barricade.ImmutableObject.extend({
      canConnectTo: function (typeName) {
        return typeName in this._automaticConnections;
      },
      getConnector: function (typeName) {
        return this._automaticConnections[typeName];
      }
    });

    hot.ResourcePropertiesFactory = function (json, parameters, type) {
      var propertyClass = hot.ResourceProperties.Normal[type] ||
          hot.ResourceProperties.Custom[type] ||
          hot.ResourceProperties.Null,
        propertiesOut;

      return propertyClass.create(json, parameters);
    };

    hot.Resource = Barricade.ImmutableObject.extend({
      _endsWith: function (str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
      },
      _getTypeValue: function (typeObj) {
        return typeObj.getValue().instanceof(hot.GetParameter)
          ? typeObj.getValue().get('get_param').get('default').get()
          : typeObj.getValue().get();
      },
      getProperties: function () {
        return this.get('properties');
      },
      getProperty: function (property) {
        return this.getProperties().get(property);
      },
      isResourceGroup: function () {
        return this._getTypeValue(this.get('type')) ===
          'OS::Heat::ResourceGroup';
      },
      isProviderResource: function () {
        var type = this.getType();
        return this._endsWith(type, '.yaml') ||
          this._endsWith(type, '.template');
      },
      getType: function () {
        return this._getTypeValue(this.isResourceGroup()
          ? this.getProperty('resource_def').get('type')
          : this.get('type'));
      },
      getShortType: function () {
        var type = this.getType();
        if (this.isProviderResource()) {
          return type.split('/').pop().split('.')[0];
        }
        return type.split('::')[2];
      },
      getAttributes: function () {
        var attributes = this.getProperties().getBackingType()
          .get('attributes').toArray();
        if (this.isResourceGroup()) {
          return attributes.concat(
            this.getProperty('resource_def').get('properties')
              .getBackingType().get('attributes').toArray());
        }
        return attributes;
      },
      getAttributeNames: function () {
        return this.getAttributes().map(function (attribute) {
          return attribute.getID();
        });
      },
      getIntrinsicFunctions: function () {
        function getIntrinsics(value) {
          var intrinsics = [];
          if (value.instanceof(hot.ResourcePropertyWrapper)) {
            return value.getIntrinsicFunctions();
          } else if (value.instanceof(Barricade.Container)) {
            value.each(function (i, element) {
              intrinsics = intrinsics.concat(getIntrinsics(element));
            });
            return intrinsics;
          }
          return [];
        }
        return getIntrinsics(this.getProperties());
      },
      canConnectTo: function (resource, checkBothWays) {
        return this.getProperties().canConnectTo(resource.getType()) ||
          (checkBothWays !== false && resource.canConnectTo(this, false));
      },
      connectTo: function (res, tryBothWays) {
        var connector = this.getProperties().getConnector(res.getType());
        if (connector) {
          connector(this, res);
        } else if (tryBothWays !== false) {
          res.connectTo(this, false);
        }
      },
      _docsBaseURL: "http://docs.rs-heat.com/raxdox/",
      getDocsLink: function () {
        var resourceType = this.getType(),
          nameTokens = resourceType.split('::'),
          resourceBase;
        if (nameTokens[0] === 'OS') {
          resourceBase = "openstack";
        } else if (nameTokens[0] === 'Rackspace') {
          resourceBase = "rackspace";
        } else {
          console.warn("Resource type not found: %s", nameTokens[0]);
          return this._docsBaseURL;
        }
        return this._docsBaseURL + resourceBase + '.html#' +
          resourceType;
      }
    }, {
      '@type': Object,

      'type': {
        '@class': hot.ResourcePropertyWrapper.extend({
          _innerClass: Barricade.create({'@type': String})
        }, {'@required': true})
      },
      'properties': {
        '@type': Object,
        '@ref': {
          to: hot.ResourceProperties,
          needs: function () { return hot.Resource; },
          getter: function (data) {
            var type = data.needed.get('type').getValue();
            if (type.instanceof(hot.GetParameter)) {
              type = type.get('get_param');
            }
            return type;
          },
          processor: function (data) {
            var type = data.val;

            if (type.instanceof(hot.Parameter)) {
              type = type.get('default');
            }

            return hot.ResourcePropertiesFactory(
              data.standIn.get(), undefined, type.get());
          }
        }
      },
      'metadata': {
        '@type': String,
        '@required': false
      },
      'depends_on': {
        '@type': Array,
        '@required': false,
        '@inputMassager': function (json) {
          if (typeof json === "string") {
            return [json];
          } else {
            return json;
          }
        },
        '@toJSON': function (options) {
          if (this.toArray().length === 1) {
            return this.get(0).toJSON(options);
          }
          return Barricade.Array.toJSON.call(this, options);
        },
        '*': {'@type': String}
      },
      'update_policy': {
        '@type': Object,
        '@required': false,
        '?': {'@type': String}
      },
      'deletion_policy': {
        '@type': String,
        '@required': false
      }
    });


    hot.ParameterDefault = Barricade.Primitive.extend({}, {
      '@required': false
    });

    (function () {
      var pd = hot.ParameterDefault;
      hot.StringParameterDefault = pd.extend({}, {'@type': String});
      hot.NumberParameterDefault = pd.extend({}, {'@type': Number});
      hot.ArrayParameterDefault = pd.extend({}, {'@type': Array});
      hot.ObjectParameterDefault = pd.extend({}, {'@type': Object});
      hot.BooleanParameterDefault = pd.extend({}, {'@type': Boolean});
    }());

    hot.ParameterConstraintFactory = function (json, parameters) {
      var key,
        types = {
          'length': hot.LengthParameterConstraint,
          'range': hot.RangeParameterConstraint,
          'allowed_values': hot.AllowedValuesParameterConstraint,
          'allowed_pattern': hot.AllowedPatternParameterConstraint,
          'custom_constraint': hot.CustomParameterConstraint,
        };

      if (!json) {
        return hot.LengthParameterConstraint.create(json, parameters);
      }

      for (key in types) {
        if (types.hasOwnProperty(key) && json.hasOwnProperty(key)) {
          return types[key].create(json, parameters);
        }
      }

      console.error('unknown constraint type');
    };

    hot.ParameterConstraint = Barricade.ImmutableObject.extend({}, {
      '@type': Object,
      'description': {
        '@type': String,
        '@required': false
      }
    });

    hot.LengthParameterConstraint = hot.ParameterConstraint.extend({}, {
      'length': {
        '@type': Object,
        'min': {
          '@type': Number,
          '@required': false
        },
        'max': {
          '@type': Number,
          '@required': false
        }
      }
    });

    hot.RangeParameterConstraint = hot.ParameterConstraint.extend({}, {
      'range': {
        '@type': Object,
        'min': {
          '@type': Number,
          '@required': false
        },
        'max': {
          '@type': Number,
          '@required': false
        }
      }
    });

    hot.AllowedValuesParameterConstraint = hot.ParameterConstraint.extend({}, {
      'allowed_values': {'@type': Array}});
    hot.AllowedPatternParameterConstraint = hot.ParameterConstraint.extend({}, {
      'allowed_pattern': {'@type': String}});
    hot.CustomParameterConstraint = hot.ParameterConstraint.extend({}, {
      'custom_constraint': {'@type': String}});

    hot.Parameter = Barricade.create({
      '@type': Object,

      'type': {'@type': String},
      'label': {
        '@type': String,
        '@required': false
      },
      'description': {
        '@type': String,
        '@required': false
      },
      'default': {
        '@type': Object,
        '@required': false,
        // default can be various types, so wrap it in an object to
        // make Barricade happy
        '@inputMassager': function (json) {
          return {value: json};
        },
        '@ref': {
          to: hot.ParameterDefault,
          needs: function () { return hot.Parameter; },
          getter: function (data) {
            return data.needed.get('type');
          },
          processor: function (data) {
            var types = {
                'string': hot.StringParameterDefault,
                '': hot.StringParameterDefault,
                'number': hot.NumberParameterDefault,
                'comma_delimited_list':
                  hot.ArrayParameterDefault,
                'json': hot.ObjectParameterDefault,
                'boolean': hot.BooleanParameterDefault,
              },
              type = data.val.get();

            return types[type].create(data.standIn.get().value);
          }
        }
      },
      'hidden': {
        '@type': Boolean,
        '@required': false,
      },
      'constraints': {
        '@type': Array,
        '@required': false,
        '*': {
          '@class': hot.ParameterConstraint,
          '@factory': hot.ParameterConstraintFactory
        }
      }
    });

    hot.ParameterGroup = Barricade.create({
      '@type': Object,
      'label': {'@type': String},
      'description': {
        '@type': String,
        '@required': false
      },
      'parameters': {
        '@type': Array,
        '@toJSON': function () {
          return this.toArray().map(function (param) {
            return param.getID();
          });
        },
        '*': {
          '@type': String,
          '@ref': {
            to: hot.Parameter,
            needs: function () { return hot.Template; },
            getter: function (data) {
              return data.needed.get('parameters')
                .getByID(data.standIn.get());
            }
          }
        }
      },
    });

    hot.Output = Barricade.create({
      '@type': Object,
      'description': {'@type': String},
      'value': {
        '@class': hot.ResourcePropertyWrapper.extend({
          _innerClass: Barricade.create({'@type': String})
        }, {})
      }
    });

    hot.Template = Barricade.create({
      '@type': Object,

      'heat_template_version': {'@type': String},
      'description': {
        '@type': String,
        '@required': false
      },
      'parameter_groups': {
        '@type': Array,
        '@required': false,
        '*': {'@class': hot.ParameterGroup}
      },
      'parameters': {
        '@type': Object,
        '@required': false,
        '?': {'@class': hot.Parameter}
      },
      'resources': {
        '@type': Object,
        '?': {'@class': hot.Resource}
      },
      'outputs': {
        '@type': Object,
        '@required': false,
        '?': {'@class': hot.Output}
      }
    });

    //hot.ProviderTemplate = Barricade.ImmutableObject.extend({
    //  getSchema: function () {
    //    function getActualType(type) {
    //      var types = {
    //        json: 'map',
    //        comma_delimited_list: 'list'
    //      };
    //      return types[type] || type;
    //    }
    //
    //    return {
    //      properties: this.get('parameters').toArray().reduce(
    //        function (objOut, param) {
    //          objOut[param.getID()] = {
    //            description: param.get('description').get(),
    //            type: getActualType(param.get('type').get())
    //          };
    //          return objOut;
    //        }, {}),
    //      attributes: this.get('outputs').toArray().reduce(
    //        function (objOut, output) {
    //          objOut[output.getID()] = {
    //            description: output.get('description').get()
    //          };
    //          return objOut;
    //        }, {})
    //    };
    //  }
    //}, {
    //  '@type': Object,
    //
    //  'heat_template_version': {'@type': String},
    //  'description': {'@type': String, '@required': false},
    //  'parameter_groups': {'@type': Array, '@required': false},
    //  'resources': {'@type': Object},
    //  'parameters': {
    //    '@type': Object,
    //    '?': {'@class': hot.Parameter}
    //  },
    //  'outputs': {
    //    '@type': Object,
    //    '@required': false,
    //    '?': {
    //      '@class': hot.Output.extend({}, {
    //        'value': {
    //          '@class': hot.Primitive,
    //          '@factory': hot.Primitive.Factory
    //        }
    //      })
    //    }
    //  }
    //});

    //// Used to find URLs of templates to load and turn into child templates
    //hot.ProviderTemplateHelper = hot.Template.extend({
    //  getProviderTemplateURLs: function () {
    //    return this.get('resources').toArray().filter(function (res) {
    //      return res.isProviderResource();
    //    }).map(function (res) {
    //      return res.getType();
    //    });
    //  }
    //}, {
    //  // Essentially, remove any unncessary reference resolving
    //  '@type': Object,
    //  'parameter_groups': {'@type': Array, '@required': false},
    //  'resources': {
    //    '@type': Object,
    //    '?': {
    //      '@class': hot.Resource.extend({}, {
    //        'properties': {'@type': Object, '@required': false},
    //        'depends_on': {
    //          '@type': Array,
    //          '@required': false,
    //          '@inputMassager': function (json) {
    //            return json instanceof Array ? json : [json];
    //          }
    //        }
    //      })
    //    }
    //  },
    //  'outputs': {'@type': Object, '@required': false}
    //});

    hot.createResourceClass = function (resourceType) {
      return hot.ResourceProperties.extend({
          getBackingType: function () {
            return resourceType;
          },
          _automaticConnections:
          HOTUI_RESOURCE_CONNECTIONS[resourceType.getID()] || {}
        },
        resourceType.getSchema());
    };

    //hot.createProviderResourceClass = function (providerTemplateJSON) {
    //  var pTemplate = hot.ProviderTemplate.create(providerTemplateJSON),
    //    resType = hot.ResourceType.create(pTemplate.getSchema());
    //  return hot.createResourceClass(resType);
    //};

    return hot;
  }

})();
