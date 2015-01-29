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

var Barricade = (function () {
    "use strict";

    var Array_, Arraylike, BarricadeMain, Base, Blueprint, Container,
        Deferrable, Deferred, Enumerated, Extendable, Identifiable,
        ImmutableObject, InstanceofMixin, MutableObject, Observable, Omittable,
        Primitive, Validatable;

    Blueprint = {
        create: function (f) {
            return function g() {
                if (!this.hasOwnProperty('_parents')) {
                    Object.defineProperty(this, '_parents', {value: []});
                }
                this._parents.push(g);
                return f.apply(this, arguments);
            };
        }
    };

    Extendable = Blueprint.create(function () {
        function deepClone(object) {
            if (isPlainObject(object)) {
                return forInKeys(object).reduce(function (clone, key) {
                    clone[key] = deepClone(object[key]);
                    return clone;
                }, {});
            }
            return object;
        }

        function extend(extension) {
            return Object.keys(extension).reduce(function (object, prop) {
                return Object.defineProperty(object, prop, {
                    enumerable: true,
                    writable: true,
                    configurable: true,
                    value: extension[prop]
                });
            }, Object.create(this));
        }

        function forInKeys(obj) {
            var key, keys = [];
            for (key in obj) { keys.push(key); }
            return keys;
        }

        function isPlainObject(obj) {
            return getType(obj) === Object &&
                Object.getPrototypeOf(Object.getPrototypeOf(obj)) === null;
        }

        function merge(target, source) {
            forInKeys(source).forEach(function (key) {
                if (target.hasOwnProperty(key) &&
                        isPlainObject(target[key]) &&
                        isPlainObject(source[key])) {
                    merge(target[key], source[key]);
                } else {
                    target[key] = deepClone(source[key]);
                }
            });
        }

        return Object.defineProperty(this, 'extend', {
            enumerable: false,
            writable: false,
            value: function (extension, schema) {
                if (schema) {
                    extension._schema = deepClone(this._schema) || {};
                    merge(extension._schema, schema);
                }
                return extend.call(this, extension);
            }
        });
    });

    InstanceofMixin = Blueprint.create(function () {
        return Object.defineProperty(this, 'instanceof', {
            enumerable: false,
            value: function (proto) {
                var _instanceof = this.instanceof,
                    subject = this;

                function hasMixin(obj, mixin) {
                    return obj.hasOwnProperty('_parents') &&
                        obj._parents.some(function (_parent) {
                            return _instanceof.call(_parent, mixin);
                        });
                }

                do {
                    if (subject === proto || hasMixin(subject, proto)) {
                        return true;
                    }
                    subject = Object.getPrototypeOf(subject);
                } while (subject);

                return false;
            }
        });
    });

    Identifiable = Blueprint.create(function (id) {
        this.getID = function () {
            return id;
        };

        this.setID = function (newID) {
            id = newID;
            return this.emit('change', 'id');
        };
    });

    Omittable = Blueprint.create(function (isUsed) {
        this.isUsed = function () {
            return this.isRequired() || isUsed;
        };

        this.setIsUsed = function (newUsedValue) {
            isUsed = !!newUsedValue;
            return this;
        };

        this.on('change', function () {
            isUsed = !this.isEmpty();
        });
    });

    Deferrable = Blueprint.create(function (schema) {
        var self = this,
            deferred;

        function resolver(neededValue) {
            var ref = schema['@ref'].resolver(self, neededValue);
            if (ref === undefined) {
                logError('Could not resolve ', JSON.stringify(self.toJSON()));
            }
            return ref;
        }

        if (schema.hasOwnProperty('@ref')) {
            deferred = Deferred.create(schema['@ref'].needs, resolver);
        }

        this.resolveWith = function (obj) {
            var allResolved = true;

            if (deferred && !deferred.isResolved()) {
                if (deferred.needs(obj)) {
                    this.emit('replace', deferred.resolve(obj));
                } else {
                    allResolved = false;
                }
            }

            if (this.instanceof(Container)) {
                this.each(function (index, value) {
                    if (!value.resolveWith(obj)) {
                        allResolved = false;
                    }
                });
            }

            return allResolved;
        };
    });

    Validatable = Blueprint.create(function (schema) {
        var constraints = schema['@constraints'],
            error = null;

        if (getType(constraints) !== Array) {
            constraints = [];
        }

        this.getError = function () { return error || ''; };
        this.hasError = function () { return error !== null; };

        this._validate = function (value) {
            function getConstraintMessage(i, lastMessage) {
                if (lastMessage !== true) {
                    return lastMessage;
                } else if (i < constraints.length) {
                    return getConstraintMessage(i + 1, constraints[i](value));
                }
                return null;
            }
            error = getConstraintMessage(0, true);
            return !this.hasError();
        };

        this.addConstraint = function (newConstraint) {
            constraints.push(newConstraint);
            return this;
        };
    });

    Enumerated = Blueprint.create(function(enum_) {
        var self = this;

        function getEnum() {
            return (typeof enum_ === 'function') ? enum_.call(self) : enum_;
        }

        this.getEnumLabels = function () {
            var curEnum = getEnum();
            return getType(curEnum[0]) === Object
                ? curEnum.map(function (value) { return value.label; })
                : curEnum;
        };

        this.getEnumValues = function () {
            var curEnum = getEnum();
            return getType(curEnum[0]) === Object
                ? curEnum.map(function (value) { return value.value; })
                : curEnum;
        };

        this.addConstraint(function (value) {
            return (self.getEnumValues().indexOf(value) > -1) ||
                'Value can only be one of ' + self.getEnumLabels().join(', ');
        });
    });

    Observable = Blueprint.create(function () {
        var events = {};

        function hasEvent(eventName) {
            return events.hasOwnProperty(eventName);
        }

        this.emit = function (eventName) {
            var args = arguments; // Must come from correct scope
            if (events.hasOwnProperty(eventName)) {
                events[eventName].forEach(function (callback) {
                    // Call with emitter as context and pass all but eventName
                    callback.apply(this, Array.prototype.slice.call(args, 1));
                }, this);
            }
            return this;
        };

        this.off = function (eventName, callback) {
            var index;

            if (hasEvent(eventName)) {
                index = events[eventName].indexOf(callback);

                if (index > -1) {
                    events[eventName].splice(index, 1);
                }
            }
            return this;
        };

        this.on = function (eventName, callback) {
            if (!hasEvent(eventName)) {
                events[eventName] = [];
            }
            events[eventName].push(callback);
            return this;
        };
    });

    Deferred = {
        create: function (classGetter, onResolve) {
            var self = Object.create(this);
            self._isResolved = false;
            self._classGetter = classGetter;
            self._onResolve = onResolve;
            return self;
        },
        isResolved: function () {
            return this._isResolved;
        },
        needs: function (obj) {
            return obj.instanceof(this._classGetter());
        },
        resolve: function (obj) {
            var ref;

            if (this._isResolved) {
                throw new Error('Deferred already resolved');
            }

            ref = this._onResolve(obj);

            if (ref !== undefined) {
                this._isResolved = true;
                return ref;
            }
        }
    };

    Base = Extendable.call(InstanceofMixin.call({
        create: function (json, parameters) {
            var proto = this.extend({}),
                self = Object.create(proto),
                schema = self._schema,
                isUsed;

            parameters = parameters || {};
            proto._parameters = this.extend.call(
              parameters, schema['@meta'] || {});

            if (schema.hasOwnProperty('@inputMassager')) {
                json = schema['@inputMassager'](json);
            }

            isUsed = self._setData(json);

            if (schema.hasOwnProperty('@toJSON')) {
                self.toJSON = schema['@toJSON'];
            }

            Observable.call(proto);
            Omittable.call(proto, isUsed);
            Deferrable.call(proto, schema);
            Validatable.call(proto, schema);

            if (schema.hasOwnProperty('@enum')) {
                Enumerated.call(proto, schema['@enum']);
            }

            if (parameters.hasOwnProperty('id')) {
                Identifiable.call(proto, parameters.id);
            }

            return self;
        },
        _getDefaultValue: function () {
            return this._schema.hasOwnProperty('@default')
                ? typeof this._schema['@default'] === 'function'
                    ? this._schema['@default']()
                    : this._schema['@default']
                : this._schema['@type']();
        },
        _setData: function(json) {
            var isUsed = true,
                type = this._schema['@type'];

            if (getType(json) !== type) {
                if (json) {
                    logError("Type mismatch. JSON: ", json,
                             "schema: ", this._schema);
                } else {
                    isUsed = false;
                }
                // Replace bad type (does not change original)
                json = this._getDefaultValue();
            }
            this.$data = this._sift(json, this._parameters);

            return isUsed;
        },
        _safeInstanceof: function (instance, class_) {
            return typeof instance === 'object' &&
                ('instanceof' in instance) &&
                instance.instanceof(class_);
        },
        _sift: function () {
            throw new Error("sift() must be overridden in subclass");
        },
        getPrimitiveType: function () {
            return this._schema['@type'];
        },
        isEmpty: function () {
            throw new Error('Subclass should override isEmpty()');
        },
        isRequired: function () {
            return this._schema['@required'] !== false;
        }
    }));

    Container = Base.extend({
        create: function (json, parameters) {
            var self = Base.create.call(this, json, parameters);

            return self.on('_addedElement', function (key) {
                self._attachListeners(key);
                self._tryResolveOn(self.get(key));
            }).each(function (index, value) {
                self._attachListeners(index);
                value.resolveWith(self);
            });
        },
        _attachListeners: function (key) {
            var self = this,
                element = this.get(key),
                events = {
                    'childChange': function (child) {
                        self.emit('childChange', child);
                    },
                    'change': function () {
                        // 'this' is set to callee, no typo
                        events.childChange(this);
                    },
                    'replace': function (newValue) {
                        self.set(key, newValue);
                        self._tryResolveOn(newValue);
                    },
                    '_resolveUp': function (value) {
                        self._tryResolveOn(value);
                    },
                    'removeFrom': function (container) {
                        if (container === self) {
                            Object.keys(events).forEach(function (eName) {
                                element.off(eName, events[eName]);
                            });
                        }
                    }
                };

            Object.keys(events).forEach(function (eName) {
                element.on(eName, events[eName]);
            });
        },
        _getKeyClass: function (key) {
            return this._schema[key].hasOwnProperty('@class')
                ? this._schema[key]['@class']
                : BarricadeMain.create(this._schema[key]);
        },
        _isCorrectType: function (instance, class_) {
            var self = this;

            function isRefTo() {
                if (typeof class_._schema['@ref'].to === 'function') {
                    return self._safeInstanceof(instance,
                                                class_._schema['@ref'].to());
                } else if (typeof class_._schema['@ref'].to === 'object') {
                    return self._safeInstanceof(instance,
                                                class_._schema['@ref'].to);
                }
                throw new Error('Ref.to was ' + class_._schema['@ref'].to);
            }

            return this._safeInstanceof(instance, class_) ||
                (class_._schema.hasOwnProperty('@ref') && isRefTo());
        },
        _keyClassCreate: function (key, keyClass, json, parameters) {
            return this._schema[key].hasOwnProperty('@factory')
                ? this._schema[key]['@factory'](json, parameters)
                : keyClass.create(json, parameters);
        },
        _tryResolveOn: function (value) {
            if (!value.resolveWith(this)) {
                this.emit('_resolveUp', value);
            }
        },
        set: function (key, value) {
            this.get(key).emit('removeFrom', this);
            this._doSet(key, value);
            this._attachListeners(key);
            return this;
        }
    });

    Arraylike = Container.extend({
        create: function (json, parameters) {
            if (!this.hasOwnProperty('_elementClass')) {
                Object.defineProperty(this, '_elementClass', {
                    enumerable: false,
                    writable: true,
                    value: this._getKeyClass(this._elSymbol)
                });
            }
            return Container.create.call(this, json, parameters);
        },
        _doSet: function (index, newVal, newParameters) {
            var oldVal = this.$data[index];

            this.$data[index] = this._isCorrectType(newVal, this._elementClass)
                ? this.$data[index] = newVal
                : this._keyClassCreate(this._elSymbol, this._elementClass,
                                       newVal, newParameters);

            this.emit('change', 'set', index, this.$data[index], oldVal);
        },
        _elSymbol: '*',
        _sift: function (json) {
            return json.map(function (el) {
                return this._keyClassCreate(
                    this._elSymbol, this._elementClass, el);
            }, this);
        }, 
        each: function (functionIn, comparatorIn) {
            var arr = this.$data.slice();

            if (comparatorIn) {
                arr.sort(comparatorIn);
            }

            arr.forEach(function (value, index) {
                functionIn(index, value);
            });

            return this;
        },
        get: function (index) {
            return this.$data[index];
        },
        isEmpty: function () {
            return !this.$data.length;
        },
        length: function () {
            return this.$data.length;
        },
        push: function (newValue, newParameters) {
            this.$data.push(
                this._isCorrectType(newValue, this._elementClass)
                    ? newValue
                    : this._keyClassCreate(this._elSymbol, this._elementClass,
                                           newValue, newParameters));

            return this.emit('_addedElement', this.$data.length - 1)
                       .emit('change', 'add', this.$data.length - 1);
        },
        remove: function (index) {
            this.$data[index].emit('removeFrom', this);
            this.$data.splice(index, 1);
            return this.emit('change', 'remove', index);
        },
        toArray: function () {
            return this.$data.slice(); // Shallow copy to prevent mutation
        },
        toJSON: function (ignoreUnused) {
            return this.$data.map(function (el) {
                return el.toJSON(ignoreUnused);
            });
        }
    });

    Array_ = Arraylike.extend({});

    ImmutableObject = Container.extend({
        create: function (json, parameters) {
            var self = this;
            if (!this.hasOwnProperty('_keyClasses')) {
                Object.defineProperty(this, '_keyClasses', {
                    enumerable: false,
                    writable: true,
                    value: this.getKeys().reduce(function (classes, key) {
                        classes[key] = self._getKeyClass(key);
                        return classes;
                    }, {})
                });
            }

            return Container.create.call(this, json, parameters);
        },
        _sift: function (json) {
            var self = this;
            return this.getKeys().reduce(function (objOut, key) {
                objOut[key] =
                    self._keyClassCreate(key, self._keyClasses[key], json[key]);
                return objOut;
            }, {});
        },
        _doSet: function (key, newValue, newParameters) {
            var oldVal = this.$data[key];

            if (this._schema.hasOwnProperty(key)) {
                if (this._isCorrectType(newValue, this._keyClasses[key])) {
                    this.$data[key] = newValue;
                } else {
                    this.$data[key] =
                        this._keyClassCreate(key, this._keyClasses[key],
                                             newValue, newParameters);
                }

                this.emit('change', 'set', key, this.$data[key], oldVal);
            } else {
                logError('object does not have key: ', key,
                         ' schema: ', this._schema);
            }
        },
        each: function (functionIn, comparatorIn) {
            var self = this,
                keys = this.getKeys();

            if (comparatorIn) {
                keys.sort(comparatorIn);
            }

            keys.forEach(function (key) {
                functionIn(key, self.$data[key]);
            });

            return this;
        },
        get: function (key) {
            return this.$data[key];
        },
        getKeys: function () {
            return Object.keys(this._schema).filter(function (key) {
                return key.charAt(0) !== '@';
            });
        },
        isEmpty: function () {
            return !Object.keys(this.$data).length;
        },
        toJSON: function (ignoreUnused) {
            var data = this.$data;
            return this.getKeys().reduce(function (jsonOut, key) {
                if (ignoreUnused !== true || data[key].isUsed()) {
                    jsonOut[key] = data[key].toJSON(ignoreUnused);
                }
                return jsonOut;
            }, {});
        }
    });

    MutableObject = Arraylike.extend({
        _elSymbol: '?',
        _sift: function (json) {
            return Object.keys(json).map(function (key) {
                return this._keyClassCreate(this._elSymbol, this._elementClass,
                                            json[key], {id: key});
            }, this);
        },
        contains: function (element) {
            return this.toArray().some(function (value) {
                return element === value;
            });
        },
        getByID: function (id) {
            return this.get(this.getPosByID(id));
        },
        getIDs: function () {
            return this.toArray().map(function (value) {
                return value.getID();
            });
        },
        getPosByID: function (id) {
            return this.getIDs().indexOf(id);
        },
        push: function (newJson, newParameters) {
            if (!this._safeInstanceof(newJson, this._elementClass) &&
                    (getType(newParameters) !== Object ||
                    !newParameters.hasOwnProperty('id'))) {
                logError('ID should be passed in with parameters object');
            } else {
                return Arraylike.push.call(this, newJson, newParameters);
            }
        },
        toJSON: function (ignoreUnused) {
            return this.toArray().reduce(function (jsonOut, element) {
                if (jsonOut.hasOwnProperty(element.getID())) {
                    logError("ID found multiple times: " + element.getID());
                } else {
                    jsonOut[element.getID()] = element.toJSON(ignoreUnused);
                }
                return jsonOut;
            }, {});
        }
    });

    Primitive = Base.extend({
        _sift: function (json) {
            return json;
        },
        get: function () {
            return this.$data;
        },
        isEmpty: function () {
            if (this._schema['@type'] === Array) {
                return !this.$data.length;
            } else if (this._schema['@type'] === Object) {
                return !Object.keys(this.$data).length;
            }
            return this.$data === this._schema['@type']();
        },
        set: function (newVal) {
            var schema = this._schema;

            function typeMatches(newVal) {
                return getType(newVal) === schema['@type'];
            }

            if (typeMatches(newVal) && this._validate(newVal)) {
                this.$data = newVal;
                return this.emit('validation', 'succeeded')
                           .emit('change');
            } else if (this.hasError()) {
                return this.emit('validation', 'failed');
            }

            logError("Setter - new value (", newVal, ")",
                     " did not match schema: ", schema);
            return this;
        },
        val: function(value) {
            if ( value === undefined ) {
                return this.get();
            } else {
                return this.set(value);
            }
        },
        toJSON: function () {
            return this.$data;
        }
    });

    var getType = (function () {
        var toString = Object.prototype.toString,
            types = {
                'boolean': Boolean,
                'number': Number,
                'string': String,
                '[object Array]': Array,
                '[object Date]': Date,
                '[object Function]': Function,
                '[object RegExp]': RegExp
            };

        return function (val) {
            return types[typeof val] || 
                   types[toString.call(val)] ||
                   (val ? Object : null);
        };
    }());

    function logError() {
        console.error.apply(console, Array.prototype.slice.call(arguments)
                                          .unshift('Barricade: '));
    }

    BarricadeMain = {
        'Array': Array_,
        'Arraylike': Arraylike,
        'Base': Base,
        'Blueprint': Blueprint,
        'Container': Container,
        'Deferrable': Deferrable,
        'Enumerated': Enumerated,
        'getType': getType, // Very helpful function
        'Identifiable': Identifiable,
        'ImmutableObject': ImmutableObject,
        'MutableObject': MutableObject,
        'Observable': Observable,
        'Omittable': Omittable,
        'Primitive': Primitive,
        'create': function (schema) {
            function schemaIsMutable() {
                return schema.hasOwnProperty('?');
            }

            function schemaIsImmutable() {
                return Object.keys(schema).some(function (key) {
                    return key.charAt(0) !== '@' && key !== '?';
                });
            }

            if (schema['@type'] === Object && schemaIsImmutable()) {
                return ImmutableObject.extend({}, schema);
            } else if (schema['@type'] === Object && schemaIsMutable()) {
                return MutableObject.extend({}, schema);
            } else if (schema['@type'] === Array && '*' in schema) {
                return Array_.extend({}, schema);
            }
            return Primitive.extend({}, schema);
        }
    };

    return BarricadeMain;

}());
