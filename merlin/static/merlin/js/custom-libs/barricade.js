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

/** @namespace */
var Barricade = (function () {
    "use strict";

    var Array_, Arraylike, BarricadeMain, Base, Blueprint, Container,
        Deferrable, Deferred, Enumerated, Extendable, Identifiable,
        ImmutableObject, InstanceofMixin, MutableObject, Observable, Omittable,
        Primitive, Validatable;

    /**
    * Blueprints are used to define mixins. They can be used to enable private
    * state. Blueprints are meant to be applied to new instances of a class to
    * provide instance methods or wrapped around a class itself to provide
    * static methods.
    *
    * Blueprints can be applied using
    * `SomeBlueprint.call(instance, arg1, arg2, ...)`
    *
    * Instances (and classes) can be checked to see if a
    * Blueprint has been applied to them using `instanceof()`<br>
    * ex: `someInstance.instanceof(SomeBlueprint)`
    * @class
    * @memberof Barricade
    */
    Blueprint = {
        /**
        * Creates a Blueprint.
        * @memberof Barricade.Blueprint
        * @param {function} f
                 A function that will be run when the Blueprint is applied. When
                 `.call(instance, arg1, arg2, ...)` is used, `instance` will be
                 set to `this` and the arguments will be passed to `f`.
        */
        create: function (f) {
            return function g() {
                var result = f.apply(this, arguments) || this;
                if (!Object.prototype.hasOwnProperty.call(result, '_parents')) {
                    Object.defineProperty(result, '_parents', {value: []});
                }
                result._parents.push(g);
                return result;
            };
        }
    };

    /**
    * @mixin
    * @memberof Barricade
    */
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
                if (Object.prototype.hasOwnProperty.call(target, key) &&
                        isPlainObject(target[key]) &&
                        isPlainObject(source[key])) {
                    merge(target[key], source[key]);
                } else {
                    target[key] = deepClone(source[key]);
                }
            });
        }

        /**
        * Extends the object, returning a new object with the original object as
          its prototype.
        * @method extend
        * @memberof Barricade.Extendable
        * @instance
        * @param {Object} extension A set of properties to add to the new
                 object.
        * @param {Object} [schema] Barricade schema.
        * @returns {Object}
        */
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

    /**
    * @mixin
    * @memberof Barricade
    */
    InstanceofMixin = Blueprint.create(function () {
        return Object.defineProperty(this, 'instanceof', {
            enumerable: false,
            value: function (proto) {
                var _instanceof = this.instanceof,
                    subject = this;

                function hasMixin(obj, mixin) {
                    return Object.prototype.hasOwnProperty
                                           .call(obj, '_parents') &&
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

    /**
    * Attaches an identifier to an object. Used as an alternative to key/value
      pairs in JSON objects when the key is user-defined. This way the key (ID)
      stays with the value.
    * @mixin
    * @memberof Barricade
    */
    Identifiable = (function () {
        var counter = 0;
        return Blueprint.create(function (id) {
            var uid = this._uidPrefix + counter++;

            /**
            * Returns the ID
            * @method getID
            * @memberof Barricade.Identifiable
            * @instance
            * @returns {String}
            */
            this.getID = function () {
                return id;
            };

            /**
            * Gets the unique ID of this particular element
            * @method uid
            * @memberof Barricade.Identifiable
            * @instance
            * @returns {String}
            */
            this.uid = function () {
                return uid;
            };

            /**
            * Checks whether the ID is set for this item.
            * @method hasID
            * @memberof Barricade.Identifiable
            * @instance
            * @returns {Boolean}
            */
            this.hasID = function() {
                return id !== undefined;
            };

            /**
            * Sets the ID.
            * @method setID
            * @memberof Barricade.Identifiable
            * @instance
            * @param {String} newID
            * @returns {self}
            */
            this.setID = function (newID) {
                id = newID;
                return this.emit('change', 'id');
            };
    });
})();

    /**
    * Tracks whether an object is being "used" or not, which is a state that
      updates whenever the object changes, but also can be explicitly set.
    * @mixin
    * @memberof Barricade
    */
    Omittable = Blueprint.create(function (isUsed) {
        /**
        * Returns whether object is being used or not.
        * @method isUsed
        * @memberof Barricade.Omittable
        * @instance
        * @returns {Boolean}
        */
        this.isUsed = function () {
            return this.isRequired() || isUsed;
        };

        /**
        * Explicitly sets whether object is being used or not.
        * @method setIsUsed
        * @memberof Barricade.Omittable
        * @instance
        * @param {Boolean} newUsedValue
        * @returns {self}
        */
        this.setIsUsed = function (newUsedValue) {
            isUsed = !!newUsedValue;
            return this;
        };

        this.on('change', function () {
            isUsed = !this.isEmpty();
        });
    });

    /**
    * @mixin
    * @memberof Barricade
    */
    Deferrable = Blueprint.create(function () {
        var existingCreate = this.create;

        this.create = function() {
            var self = existingCreate.apply(this, arguments),
                schema = self._schema,
                needed,
                deferred;

            self.setDeferred = function (refObj, postProcessor, callee) {
                deferred = refObj ?
                    Deferred.create(refObj.needs, getter, resolver) : null;

                callee = callee || self;

                if (refObj && !refObj.processor) {
                    refObj.processor = function (o) { return o.val; };
                }

                function getter(neededVal) {
                    return refObj.getter({standIn: callee, needed: neededVal});
                }

                function resolver(retrievedValue) {
                    postProcessor.call(callee, refObj.processor({
                        val: retrievedValue,
                        standIn: callee,
                        needed: needed
                    }));
                }
            };

            self.setDeferred(schema['@ref'], function(processed) {
                self.emit('replace', processed);
                self.emit('replaceComplete');
            });

            self.resolveWith = function (obj) {
                var allResolved = true;

                if (deferred && !deferred.isResolved()) {
                    if (deferred.needs(obj)) {
                        needed = obj;
                        deferred.resolve(obj);
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

            self.isPlaceholder = function () {
                return !!deferred;
            };

            return self;
        };

        this.isValidRef = function(instance) {
            var clsRef = this._schema['@ref'];
            if (!clsRef) {
                return false;
            }
            if (typeof clsRef.to === 'function') {
                return this._safeInstanceof(instance, clsRef.to());
            } else if (typeof clsRef.to === 'object') {
                return this._safeInstanceof(instance, clsRef.to);
            }
            throw new Error('Ref.to was ' + clsRef.to);
        };

        return this;
    });

    /**
    * @mixin
    * @memberof Barricade
    */
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

    /**
    * Defines a constraint on the possible values a Barricade object can take.
      Enums can be defined simply as an array of values or an array of objects
      of the form `{label: someLabel, value: someValue}`.
    * @mixin
    * @memberof Barricade
    */
    Enumerated = Blueprint.create(function(enum_) {
        var self = this;

        function getEnum() {
            return (typeof enum_ === 'function') ? enum_.call(self) : enum_;
        }

        /**
        * Returns an array of labels. If the enum has defined labels, those are
          returned. If the enum is simply a set of values, the values are
          returned as the labels.
        * @method getEnumLabels
        * @memberof Barricade.Enumerated
        * @instance
        * @returns {Array}
        */
        this.getEnumLabels = function () {
            var curEnum = getEnum();
            return getType(curEnum[0]) === Object
                ? curEnum.map(function (value) { return value.label; })
                : curEnum;
        };

        /**
        * Returns an array of only the enum's values.
        * @method getEnumValues
        * @memberof Barricade.Enumerated
        * @instance
        * @returns {Array}
        */
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

    /**
    * @mixin
    * @memberof Barricade
    */
    Observable = Blueprint.create(function () {
        var events = {};

        function hasEvent(eventName) {
            return events.hasOwnProperty(eventName);
        }

        /**
        * Executes all callbacks associated with an event in the order that they
          were added.
        * @method emit
        * @memberof Barricade.Observable
        * @instance
        * @param {String} eventName
        * @returns {self}
        */
        this.emit = function (eventName) {
            var args = arguments; // Must come from correct scope
            if (events.hasOwnProperty(eventName)) {
                events[eventName].slice().forEach(function (callback) {
                    // Call with emitter as context and pass all but eventName
                    callback.apply(this, Array.prototype.slice.call(args, 1));
                }, this);
            }
            return this;
        };

        /**
        * Removes a callback for a particular event.
        * @method off
        * @memberof Barricade.Observable
        * @instance
        * @param {String} eventName
        * @param {Function} callback
        * @returns {self}
        */
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

        /**
        * Specifies a callback to be executed when the Observable emits
          a particular event
        * @method on
        * @memberof Barricade.Observable
        * @instance
        * @param {String} eventName
        * @param {Function} callback
        * @returns {self}
        */
        this.on = function (eventName, callback) {
            if (!hasEvent(eventName)) {
                events[eventName] = [];
            }
            events[eventName].push(callback);
            return this;
        };
    });

    /**
    * @class
    * @memberof Barricade
    */
    Deferred = {
        /**
        * @memberof Barricade.Deferred
        * @instance
        * @param {Function} classGetter
        * @param {Function} onResolve
                 Callback to execute when resolve happens.
        * @returns {Barricade.Deferred}
        */
        create: function (classGetter, getter, onResolve) {
            var self = Object.create(this);
            self._isResolved = false;
            self._classGetter = classGetter;
            self._getter = getter;
            self._onResolve = onResolve;
            return self;
        },

        /**
        * @memberof Barricade.Deferred
        * @instance
        * @returns {Boolean}
        */
        isResolved: function () {
            return this._isResolved;
        },

        /**
        * @memberof Barricade.Deferred
        * @instance
        * @param obj
        * @returns {Boolean}
        */
        needs: function (obj) {
            return obj.instanceof(this._classGetter());
        },

        /**
        * @memberof Barricade.Deferred
        * @instance
        * @param obj
        */
        resolve: function (obj) {
            var self = this,
                neededValue;

            function doResolve(realNeededValue) {
                neededValue.off('replace', doResolve);
                self._onResolve(realNeededValue);
                self._isResolved = true;
            }

            if (this._isResolved) {
                throw new Error('Deferred already resolved');
            }

            neededValue = this._getter(obj);

            if (neededValue.isPlaceholder()) {
                neededValue.on('replace', doResolve);
            } else {
                doResolve(neededValue);
            }
        }
    };

    /**
    * @class
    * @memberof Barricade
    * @mixes   Barricade.Extendable
    * @extends Barricade.Extendable
    * @mixes   Barricade.InstanceofMixin
    * @extends Barricade.InstanceofMixin
    * @mixes   Barricade.Observable
    * @extends Barricade.Observable
    * @mixes   Barricade.Omittable
    * @extends Barricade.Omittable
    * @mixes   Barricade.Deferrable
    * @extends Barricade.Deferrable
    * @mixes   Barricade.Validatable
    * @extends Barricade.Validatable
    * @mixes   Barricade.Enumerated
    * @extends Barricade.Enumerated
    * @mixes   Barricade.Identifiable
    * @extends Barricade.Identifiable
    */
    Base = Deferrable.call(Extendable.call(InstanceofMixin.call({
        /**
        * Creates a `Base` instance
        * @memberof Barricade.Base
        * @param {JSON} json
        * @param {Object} parameters
        * @returns {Barricade.Base}
        */
        create: function (json, parameters) {
            var self = this.extend({}),
                schema = self._schema,
                isUsed, id;

            self._parameters = parameters = parameters || {};

            if (schema.hasOwnProperty('@inputMassager')) {
                json = schema['@inputMassager'](json);
            }

            isUsed = self._setData(json);

            if (schema.hasOwnProperty('@toJSON')) {
                self.toJSON = schema['@toJSON'];
            }

            Observable.call(self);
            Omittable.call(self, isUsed);
            Validatable.call(self, schema);

            if (schema.hasOwnProperty('@enum')) {
                Enumerated.call(self, schema['@enum']);
            }

            if ( Object.hasOwnProperty.call(parameters, 'id') ) {
                id = parameters.id;
            }
            Identifiable.call(self, id);

            return self;
        },

        /**
        * @memberof Barricade.Base
        * @private
        */
        _uidPrefix: 'obj-',

        /**
        * @memberof Barricade.Base
        * @private
        */
        _getDefaultValue: function () {
            return this._schema.hasOwnProperty('@default')
                ? typeof this._schema['@default'] === 'function'
                    ? this._schema['@default'].call(this)
                    : this._schema['@default']
                : this._schema['@type']();
        },

        /**
        * @memberof Barricade.Base
        * @private
        */
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
            this._data = this._sift(json, this._parameters);

            return isUsed;
        },

        /**
        * @memberof Barricade.Base
        * @private
        */
        _safeInstanceof: function (instance, class_) {
            return getType(instance) === Object &&
                ('instanceof' in instance) &&
                instance.instanceof(class_);
        },

        /**
        * @memberof Barricade.Base
        * @private
        */
        _sift: function () {
            throw new Error("sift() must be overridden in subclass");
        },

        /**
        * @memberof Barricade.Base
        * @private
        */
        _getPrettyJSON: function (options) {
            return this._getJSON(options);
        },

        /**
        * Returns the primitive type of the Barricade object.
        * @memberof Barricade.Base
        * @instance
        * @returns {constructor}
        */
        getPrimitiveType: function () {
            return this._schema['@type'];
        },

        /**
        * @memberof Barricade.Base
        * @instance
        * @virtual
        */
        isEmpty: function () {
            throw new Error('Subclass should override isEmpty()');
        },

        /**
        * Returns whether the Barricade object is required or not. Usually
          affects output of `toJSON()`. Use the `@required` tag in the schema to
          specify this option.
        * @memberof Barricade.Base
        * @instance
        * @returns {Boolean}
        */
        isRequired: function () {
            return this._schema['@required'] !== false;
        },

        /**
        * Returns the JSON representation of the Barricade object.
        * @memberof Barricade.Base
        * @instance
        * @param {Object} [options]
                 An object containing options that affect the JSON result.
                 Current supported options are ignoreUnused (Boolean, defaults
                 to false), which skips keys with values that are unused in
                 objects, and pretty (Boolean, defaults to false), which gives
                 control to the method `_getPrettyJSON`.
        * @returns {JSON}
        */
        toJSON: function (options) {
            options = options || {};
            return options.pretty
                ? this._getPrettyJSON(options)
                : this._getJSON(options);
        }
    })));

    /**
    * @class
    * @memberof Barricade
    * @extends Barricade.Base
    */
    Container = Base.extend({
        /**
        * Creates a `Container` instance.
        * @memberof Barricade.Container
        * @param {JSON} json
        * @param {Object} parameters
        * @returns {Barricade.Container}
        */
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

        /**
        * @memberof Barricade.Container
        * @private
        */
        _attachListeners: function (key) {
            var self = this,
                element = this.get(key),
                slice = Array.prototype.slice,
                events = {
                    'childChange': function () {
                        self.emit.apply(self,
                          ['childChange'].concat(slice.call(arguments)));
                    },
                    'change': function () {
                        // 'this' is set to callee, no typo
                        events.childChange.apply(events,
                          [this].concat(slice.call(arguments)));
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

        /**
        * @memberof Barricade.Container
        * @private
        */
        _getKeyClass: function (key) {
            return this._schema[key].hasOwnProperty('@class')
                ? this._schema[key]['@class']
                : BarricadeMain.create(this._schema[key]);
        },

        /**
        * @memberof Barricade.Container
        * @private
        */
        _isCorrectType: function (instance, class_) {
            return this._safeInstanceof(instance, class_) ||
                class_.isValidRef(instance);
        },

        /**
        * @memberof Barricade.Container
        * @private
        */
        _keyClassCreate: function (key, keyClass, json, parameters) {
            return this._schema[key].hasOwnProperty('@factory')
                ? this._schema[key]['@factory'](json, parameters)
                : keyClass.create(json, parameters);
        },

        /**
        * @memberof Barricade.Container
        * @private
        */
        _tryResolveOn: function (value) {
            if (!value.resolveWith(this)) {
                this.emit('_resolveUp', value);
            }
        },

        /**
        * @memberof Barricade.Container
        * @instance
        * @param key
        * @param {Element} value
        * @returns {self}
        */
        set: function (key, value) {
            this.get(key).emit('removeFrom', this);
            this._doSet(key, value);
            this._attachListeners(key);
            return this;
        }
    });

    /**
    * @class
    * @memberof Barricade
    * @extends Barricade.Container
    */
    Arraylike = Container.extend({
        /**
        * Creates an Arraylike.
        * @memberof Barricade.Arraylike
        * @returns {Barricade.Arraylike} New Arraylike instance.
        */
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

        /**
        * @memberof Barricade.Arraylike
        * @private
        */
        _doSet: function (index, newVal, newParameters) {
            var oldVal = this._data[index];

            this._data[index] = this._isCorrectType(newVal, this._elementClass)
                ? this._data[index] = newVal
                : this._keyClassCreate(this._elSymbol, this._elementClass,
                                       newVal, newParameters);

            this.emit('change', 'set', index, this._data[index], oldVal);
        },

        /**
        * @memberof Barricade.Arraylike
        * @private
        */
        _elSymbol: '*',

        /**
        * @memberof Barricade.Arraylike
        * @private
        */
        _sift: function (json, parameters) {
            return json.map(function (el) {
                return this._keyClassCreate(
                    this._elSymbol, this._elementClass, el, parameters);
            }, this);
        }, 

        /**
        * @memberof Barricade.Arraylike
        * @private
        */
        _getJSON: function (options) {
            return this._data.map(function (el) {
                return el.toJSON(options);
            });
        },

        /**
        * @callback Barricade.Arraylike.eachCB
        * @param {Number} index
        * @param {Element} value
                 Instance of the Arraylike's Element class at index
        */

        /**
        * @memberof Barricade.Arraylike
        * @instance
        * @param {Barricade.Arraylike.eachCB} functionIn
                 A function to be called for each element in the array
        * @param {Function} comparatorIn
                 Comparator in the form that JavaScript's Array.sort() expects
        * @returns {self}
        */
        each: function (functionIn, comparatorIn) {
            var arr = this._data.slice();

            if (comparatorIn) {
                arr.sort(comparatorIn);
            }

            arr.forEach(function (value, index) {
                functionIn(index, value);
            });

            return this;
        },

        /**
        * @memberof Barricade.Arraylike
        * @instance
        * @param {Integer} index
        * @returns {Element}
        */
        get: function (index) {
            return this._data[index];
        },

        /**
        * Returns true if no elements are present, false otherwise.
        * @memberof Barricade.Arraylike
        * @instance
        * @returns {Boolean}
        */
        isEmpty: function () {
            return !this._data.length;
        },

        /**
        * Returns number of elements in Arraylike
        * @memberof Barricade.Arraylike
        * @instance
        * @returns {Number}
        */
        length: function () {
            return this._data.length;
        },

        /**
        * Appends an element to the end of the Arraylike.
        * @memberof Barricade.Arraylike
        * @instance
        * @param {JSON|Element} newValue
                 JSON in the form that the element schema expects, or an
                 instance of the Arraylike's element class.
        * @param {Object} [newParameters]
                 If JSON was passed in for newValue, a parameters object can be
                 passed in.
        * @returns {self}
        */
        push: function (newValue, newParameters) {
            this._data.push(
                this._isCorrectType(newValue, this._elementClass)
                    ? newValue
                    : this._keyClassCreate(this._elSymbol, this._elementClass,
                                           newValue, newParameters));

            return this.emit('_addedElement', this._data.length - 1)
                       .emit('change', 'add', this._data.length - 1);
        },

        /**
        * Removes element at specified index.
        * @memberof Barricade.Arraylike
        * @instance
        * @param {Integer} index
        * @returns {self}
        */
        remove: function (index) {
            this._data[index].emit('removeFrom', this);
            this._data.splice(index, 1);
            return this.emit('change', 'remove', index);
        },

        /**
        * Returns an array containing the Arraylike's elements
        * @memberof Barricade.Arraylike
        * @instance
        * @returns {Array}
        */
        toArray: function () {
            return this._data.slice(); // Shallow copy to prevent mutation
        }
    });

    /**
    * Array_ is provided to simply differentiate between Barricade arrays and
    * other classes that are array-like, such as MutableObject.
    * @class
    * @extends Barricade.Arraylike
    * @memberof Barricade
    */
    Array_ = Arraylike.extend({});

    /**
    * @class
    * @memberof Barricade
    * @extends Barricade.Container
    */
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

        /**
        * @memberof Barricade.ImmutableObject
        * @private
        */
        _sift: function (json, parameters) {
            var self = this;
            return this.getKeys().reduce(function (objOut, key) {
                objOut[key] = self._keyClassCreate(
                  key, self._keyClasses[key], json[key], parameters);
                return objOut;
            }, {});
        },

        /**
        * @memberof Barricade.ImmutableObject
        * @private
        */
        _doSet: function (key, newValue, newParameters) {
            var oldVal = this._data[key];

            if (this._schema.hasOwnProperty(key)) {
                if (this._isCorrectType(newValue, this._keyClasses[key])) {
                    this._data[key] = newValue;
                } else {
                    this._data[key] =
                        this._keyClassCreate(key, this._keyClasses[key],
                                             newValue, newParameters);
                }

                this.emit('change', 'set', key, this._data[key], oldVal);
            } else {
                logError('object does not have key: ', key,
                         ' schema: ', this._schema);
            }
        },

        /**
        * @memberof Barricade.ImmutableObject
        * @private
        */
        _getJSON: function (options) {
            var data = this._data;
            return this.getKeys().reduce(function (jsonOut, key) {
                if (options.ignoreUnused !== true || data[key].isUsed()) {
                    jsonOut[key] = data[key].toJSON(options);
                }
                return jsonOut;
            }, {});
        },

        /**
        * @callback Barricade.ImmutableObject.eachCB
        * @param {String} key
        * @param {Element} value
                 Instance of the ImmutableObject's Element class at index
        */

        /**
        * @memberof Barricade.ImmutableObject
        * @instance
        * @param {Barricade.ImmutableObject.eachCB} functionIn
                 A function to be called for each element in the array
        * @param {Function} comparatorIn
                 Comparator in the form that JavaScript's Array.sort() expects
        * @returns {self}
        */
        each: function (functionIn, comparatorIn) {
            var self = this,
                keys = this.getKeys();

            if (comparatorIn) {
                keys.sort(comparatorIn);
            }

            keys.forEach(function (key) {
                functionIn(key, self._data[key]);
            });

            return this;
        },

        /**
        * @memberof Barricade.Arraylike
        * @instance
        * @param {String} key
        * @returns {Element}
        */
        get: function (key) {
            return this._data[key];
        },

        /**
        * Returns all keys in the ImmutableObject
        * @memberof Barricade.ImmutableObject
        * @instance
        * @returns {Array}
        */
        getKeys: function () {
            return Object.keys(this._schema).filter(function (key) {
                return key.charAt(0) !== '@';
            });
        },

        /**
        * Returns true if ImmutableObject has no keys, false otherwise.
        * @memberof Barricade.ImmutableObject
        * @instance
        * @returns {Boolean}
        */
        isEmpty: function () {
            return !Object.keys(this._data).length;
        }
    });

    /**
    * @class
    * @memberof Barricade
    * @extends Barricade.Arraylike
    */
    MutableObject = Arraylike.extend({
        /**
        * @memberof Barricade.MutableObject
        * @private
        */
        _elSymbol: '?',

        /**
        * @memberof Barricade.MutableObject
        * @private
        */
        _getJSON: function (options) {
            return this.toArray().reduce(function (jsonOut, element) {
                if (jsonOut.hasOwnProperty(element.getID())) {
                    logError("ID found multiple times: " + element.getID());
                } else {
                    jsonOut[element.getID()] = element.toJSON(options);
                }
                return jsonOut;
            }, {});
        },

        /**
        * @memberof Barricade.MutableObject
        * @private
        */
        _sift: function (json, parameters) {
            return Object.keys(json).map(function (key) {
                var params = Object.create(parameters);
                params.id = key;
                return this._keyClassCreate(
                  this._elSymbol, this._elementClass, json[key], params);
            }, this);
        },

        /**
        * Returns true if MutableObject contains `element`, false otherwise.
        * @memberof Barricade.MutableObject
        * @instance
        * @param element Element to check for.
        * @returns {Boolean}
        */
        contains: function (element) {
            return this.toArray().some(function (value) {
                return element === value;
            });
        },

        /**
        * Retrieves element with specified ID.
        * @memberof Barricade.MutableObject
        * @instance
        * @param {String} id
        * @returns {Element}
        */
        getByID: function (id) {
            return this.get(this.getPosByID(id));
        },

        /**
        * Returns an array of the IDs of the elements of the MutableObject.
        * @memberof Barricade.MutableObject
        * @instance
        * @returns {Array}
        */
        getIDs: function () {
            return this.toArray().map(function (value) {
                return value.getID();
            });
        },

        /**
        * Returns index of the element with the specified ID.
        * @memberof Barricade.MutableObject
        * @instance
        * @param {String} id
        * @returns {Integer}
        */
        getPosByID: function (id) {
            return this.getIDs().indexOf(id);
        },

        /**
        * Adds a new element to the MutableObject.
        * @memberof Barricade.MutableObject
        * @instance
        * @param {JSON|Element} newJson
                 JSON in the form that the element schema expects, or an
                 instance of the MutableObject's element class.
        * @param {Object} [newParameters]
                 If JSON was passed in for newJson, a parameters object with at
                 least an `id` property is required.
        * @returns {self}
        */
        push: function (newJson, newParameters) {
            if (!this._safeInstanceof(newJson, this._elementClass) &&
                    (getType(newParameters) !== Object ||
                    !newParameters.hasOwnProperty('id'))) {
                logError('ID should be passed in with parameters object');
            } else {
                return Arraylike.push.call(this, newJson, newParameters);
            }
        }
    });

    /**
    * @class
    * @memberof Barricade
    * @extends Barricade.Base
    */
    Primitive = Base.extend({
        /**
        * @memberof Barricade.Primitive
        * @private
        */
        _sift: function (json) {
            return json;
        },

        /**
        * @memberof Barricade.Primitive
        * @private
        */
        _getJSON: function () {
            return this._data;
        },

        /**
        * Retrieves the Primitive's value.
        * @memberof Barricade.Primitive
        * @instance
        * @returns {JSON}
        */
        get: function () {
            return this._data;
        },

        /**
        * Returns true if the Primitive's data is empty. This depends on the
          type; Arrays and Objects are considered empty if they have no
          elements, while Strings, Numbers, and Booleans are empty if they are
          equivalent to a newly-constructed instance.
        * @memberof Barricade.Primitive
        * @instance
        * @returns {Boolean}
        */
        isEmpty: function () {
            if (this._schema['@type'] === Array) {
                return !this._data.length;
            } else if (this._schema['@type'] === Object) {
                return !Object.keys(this._data).length;
            }
            return this._data === this._schema['@type']();
        },

        /**
        * @memberof Barricade.Primitive
        * @instance
        * @param newVal
        * @returns {self}
        */
        set: function (newVal) {
            var schema = this._schema;

            function typeMatches(newVal) {
                return getType(newVal) === schema['@type'];
            }

            if (typeMatches(newVal) && this._validate(newVal)) {
                this._data = newVal;
                return this.emit('validation', 'succeeded')
                           .emit('change');
            } else if (this.hasError()) {
                return this.emit('validation', 'failed');
            }

            logError("Setter - new value (", newVal, ")",
                     " did not match schema: ", schema);
            return this;
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
        var args = Array.prototype.slice.call(arguments);
        console.error.apply(console, ['Barricade: '].concat(args));
    }

    BarricadeMain = {
        'Array': Array_,
        'Arraylike': Arraylike,
        'Base': Base,
        'Blueprint': Blueprint,
        'Container': Container,
        'Deferrable': Deferrable,
        'Enumerated': Enumerated,
        'Extendable': Extendable,
        'getType': getType, // Very helpful function
        'Identifiable': Identifiable,
        'ImmutableObject': ImmutableObject,
        'InstanceofMixin': InstanceofMixin,
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
