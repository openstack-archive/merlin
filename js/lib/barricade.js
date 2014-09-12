// Copyright 2014 Drago Rosson
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

Barricade = (function () {
    "use strict";

    var Blueprint = {
            create: function (f) {
                var g = function () {
                        if (this.hasOwnProperty('_parents')) {
                            this._parents.push(g);
                        } else {
                            Object.defineProperty(this, '_parents', {
                                value: [g]
                            });
                        }

                        f.apply(this, arguments);
                    };

                return g;
            }
    };

    var Identifiable = Blueprint.create(function (id) {
        this.getID = function () {
            return id;
        };

        this.setID = function (newID) {
            id = newID;
            this.emit('change', 'id');
        };
    });

    var Omittable = Blueprint.create(function (isUsed) {
        this.isUsed = function () {
            // If required, it has to be used.
            return this.isRequired() || isUsed;
        };

        this.setIsUsed = function (newUsedValue) {
            isUsed = !!newUsedValue;
        };

        this.on('change', function () {
            isUsed = !this.isEmpty();
        });
    });

    var Deferrable = Blueprint.create(function (schema) {
        var self = this,
            deferred;

        function resolver(neededValue) {
            var ref = schema['@ref'].resolver(self, neededValue);
            if (ref === undefined) {
                logError('Could not resolve "' + 
                          JSON.stringify(self.toJSON()) + '"');
            }
            return ref;
        }

        function hasDependency() {
            return schema.hasOwnProperty('@ref');
        }

        this.hasDependency = hasDependency;

        if (hasDependency()) {
            this.getDeferred = function () {
                return deferred;
            };

            deferred = Deferred.create(schema['@ref'].needs,
                                                 resolver);
        }
    });

    var Validatable = Blueprint.create(function (schema) {
        var constraints = schema['@constraints'],
            error = null;

        if (getType(constraints) !== Array) {
            constraints = [];
        }

        this.hasError = function () { return error !== null; };
        this.getError = function () { return error || ''; };

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
        };
    });

    var Enumerated = Blueprint.create(function(enum_) {
        var self = this;

        function getEnum() {
            return (typeof enum_ === 'function') ? enum_() : enum_;
        }

        this.getEnumLabels = function () {
            var curEnum = getEnum();
            if (getType(curEnum[0]) === Object) {
                return curEnum.map(function (value) { return value.label; });
            } else {
                return curEnum;
            }
        };

        this.getEnumValues = function () {
            var curEnum = getEnum();
            if (getType(curEnum[0]) === Object) {
                return curEnum.map(function (value) { return value.value; });
            } else {
                return curEnum;
            }
        };

        this.addConstraint(function (value) {
            return (self.getEnumValues().indexOf(value) > -1) ||
                'Value can only be one of ' + self.getEnumLabels().join(', ');
        });
    });

    var Observable = Blueprint.create(function () {
        var events = {};

        function hasEvent(eventName) {
            return events.hasOwnProperty(eventName);
        }

        // Adds listener for event
        this.on = function (eventName, callback) {
            if (!hasEvent(eventName)) {
                events[eventName] = [];
            }

            events[eventName].push(callback);
        };

        // Removes listener for event
        this.off = function (eventName, callback) {
            var index;

            if (hasEvent(eventName)) {
                index = events[eventName].indexOf(callback);

                if (index > -1) {
                    events[eventName].splice(index, 1);
                }
            }
        };

        this.emit = function (eventName) {
            var args = arguments; // Must come from correct scope
            if (events.hasOwnProperty(eventName)) {
                events[eventName].forEach(function (callback) {
                    // Call with emitter as context and pass all but eventName
                    callback.apply(this, Array.prototype.slice.call(args, 1));
                }, this);
            }
        };
    });

    var Deferred = {
        create: function (classGetter, onResolve) {
            var self = Object.create(this),
                callbacks = [],
                isResolved = false;

            self.getClass = function () {
                return classGetter();
            };

            self.resolve = function (obj) {
                var ref;

                if (isResolved) {
                    throw new Error('Deferred already resolved');
                }

                ref = onResolve(obj);
                isResolved = true;

                if (ref === undefined) {
                    logError('Could not resolve reference');
                } else {
                    callbacks.forEach(function (callback) {
                        callback(ref);
                    });
                }

                return ref;
            };

            self.isResolved = function () {
                return isResolved;
            };

            self.addCallback = function (callback) {
                callbacks.push(callback);
            };
            
            return self;
        }
    };

    var Base = (function () {
        var base = {};

        function forInKeys(obj) {
            var key,
                keys = [];

            for (key in obj) {
                keys.push(key);
            }

            return keys;
        }

        function isPlainObject(obj) {
            return getType(obj) === Object &&
                Object.getPrototypeOf(Object.getPrototypeOf(obj)) === null;
        }

        function extend(extension) {
            function addProperty(object, prop) {
                return Object.defineProperty(object, prop, {
                    enumerable: true,
                    writable: true,
                    configurable: true,
                    value: extension[prop]
                });
            }

            // add properties to extended object
            return Object.keys(extension).reduce(addProperty,
                                                 Object.create(this));
        }

        function deepClone(object) {
            if (isPlainObject(object)) {
                return forInKeys(object).reduce(function (clone, key) {
                    clone[key] = deepClone(object[key]);
                    return clone;
                }, {});
            }
            return object;
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

        Object.defineProperty(base, 'extend', {
            enumerable: false,
            writable: false,
            value: function (extension, schema) {
                if (schema) {
                    extension._schema = '_schema' in this ?
                                            deepClone(this._schema) : {};
                    merge(extension._schema, schema);
                }
                
                return extend.call(this, extension);
            }
        });

        Object.defineProperty(base, 'instanceof', {
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
                    if (subject === proto ||
                            hasMixin(subject, proto)) {
                        return true;
                    }
                    subject = Object.getPrototypeOf(subject);
                } while (subject);

                return false;
            }
        });
        
        return base.extend({
            create: function (json, parameters) {
                var self = this.extend({}),
                    schema = self._schema,
                    type = schema['@type'];

                if (!parameters) {
                    parameters = {};
                }

                if (schema.hasOwnProperty('@inputMassager')) {
                    json = schema['@inputMassager'](json);
                }

                if (getType(json) !== type) {
                    if (json) {
                        logError("Type mismatch (json, schema)");
                        logVal(json, schema);
                    } else {
                        parameters.isUsed = false;
                    }

                    // Replace bad type (does not change original)
                    json = type();
                }

                self._data = self._sift(json, parameters);
                self._parameters = parameters;

                if (schema.hasOwnProperty('@toJSON')) {
                    self.toJSON = schema['@toJSON'];
                }

                Observable.call(self);
                Omittable.call(self, parameters.isUsed !== false);
                Deferrable.call(self, schema);
                Validatable.call(self, schema);

                if (schema.hasOwnProperty('@enum')) {
                    Enumerated.call(self, schema['@enum']);
                }

                if (parameters.hasOwnProperty('id')) {
                    Identifiable.call(self, parameters.id);
                }

                return self;
            },
            _sift: function () {
                throw new Error("sift() must be overridden in subclass");
            },
            _safeInstanceof: function (instance, class_) {
                return typeof instance === 'object' &&
                    ('instanceof' in instance) &&
                    instance.instanceof(class_);
            },
            getPrimitiveType: function () {
                return this._schema['@type'];
            },
            isRequired: function () {
                return this._schema['@required'] !== false;
            },
            isEmpty: function () {
                throw new Error('Subclass should override isEmpty()');
            }
        });
    }());

    var Container = Base.extend({
        create: function (json, parameters) {
            var self = Base.create.call(this, json, parameters),
                allDeferred = [];

            function attachListeners(key) {
                self._attachListeners(key);
            }

            function getOnResolve(key) {
                return function (resolvedValue) {
                    self.set(key, resolvedValue);
                
                    if (resolvedValue.hasDependency()) {
                        allDeferred.push(resolvedValue.getDeferred());
                    }

                    if ('getAllDeferred' in resolvedValue) {
                        allDeferred = allDeferred.concat(
                            resolvedValue.getAllDeferred());
                    }
                };
            }

            function attachDeferredCallback(key, value) {
                if (value.hasDependency()) {
                    value.getDeferred().addCallback(getOnResolve(key));
                }
            }

            function deferredClassMatches(deferred) {
                return self.instanceof(deferred.getClass());
            }

            function addDeferredToList(obj) {
                if (obj.hasDependency()) {
                    allDeferred.push(obj.getDeferred());
                }

                if ('getAllDeferred' in obj) {
                    allDeferred = allDeferred.concat(
                                       obj.getAllDeferred());
                }
            }

            function resolveDeferreds() {
                var curDeferred,
                    unresolvedDeferreds = [];

                // New deferreds can be added to allDeferred as others are
                // resolved. Iterating this way is safe regardless of how 
                // new elements are added.
                while (allDeferred.length > 0) {
                    curDeferred = allDeferred.shift();

                    if (!curDeferred.isResolved()) {
                        if (deferredClassMatches(curDeferred)) {
                            curDeferred.addCallback(addDeferredToList);
                            curDeferred.resolve(self);
                        } else {
                            unresolvedDeferreds.push(curDeferred);
                        }
                    }
                }

                allDeferred = unresolvedDeferreds;
            }

            self.on('_addedElement', attachListeners);
            self.each(attachListeners);

            self.each(function (key, value) {
                attachDeferredCallback(key, value);
            });

            if (self.hasDependency()) {
                allDeferred.push(self.getDeferred());
            }

            self.each(function (key, value) {
                addDeferredToList(value);
            });

            resolveDeferreds.call(self);

            self.getAllDeferred = function () {
                return allDeferred;
            };

            return self;
        },
        _attachListeners: function (key) {
            var self = this,
                element = this.get(key);

            function onChildChange(child) {
                self.emit('childChange', child);
            }

            function onDirectChildChange() {
                onChildChange(this); // 'this' is set to callee, not typo
            }

            function onReplace(newValue) {
                self.set(key, newValue);
            }

            element.on('childChange', onChildChange);
            element.on('change', onDirectChildChange);
            element.on('replace', onReplace);

            element.on('removeFrom', function (container) {
                if (container === self) {
                    element.off('childChange', onChildChange);
                    element.off('change', onDirectChildChange);
                    element.off('replace', onReplace);
                }
            });
        },
        set: function (key, value) {
            this.get(key).emit('removeFrom', this);
            this._doSet(key, value);
            this._attachListeners(key);
        },
        _getKeyClass: function (key) {
            return this._schema[key].hasOwnProperty('@class')
                ? this._schema[key]['@class']
                : BarricadeMain.create(this._schema[key]);
        },
        _keyClassCreate: function (key, keyClass, json, parameters) {
            return this._schema[key].hasOwnProperty('@factory')
                ? this._schema[key]['@factory'](json, parameters)
                : keyClass.create(json, parameters);
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
        }
    });

    var Arraylike = Container.extend({
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
        _elSymbol: '*',
        _sift: function (json, parameters) {
            return json.map(function (el) {
                return this._keyClassCreate(this._elSymbol,
                                              this._elementClass, el);
            }, this);
        }, 
        get: function (index) {
            return this._data[index];
        },
        each: function (functionIn, comparatorIn) {
            var arr = this._data.slice();

            if (comparatorIn) {
                arr.sort(comparatorIn);
            }

            arr.forEach(function (value, index) {
                functionIn(index, value);
            });
        },
        toArray: function () {
            return this._data.slice(); // Shallow copy to prevent mutation
        },
        _doSet: function (index, newVal, newParameters) {
            var oldVal = this._data[index];

            if (this._isCorrectType(newVal, this._elementClass)) {
                this._data[index] = newVal;
            } else {
                this._data[index] = this._keyClassCreate(
                                  this._elSymbol, this._elementClass,
                                  newVal, newParameters);
            }

            this.emit('change', 'set', index, this._data[index], oldVal);
        },
        length: function () {
            return this._data.length;
        },
        isEmpty: function () {
            return this._data.length === 0;
        },
        toJSON: function (ignoreUnused) {
            return this._data.map(function (el) {
                return el.toJSON(ignoreUnused);
            });
        },
        push: function (newValue, newParameters) {
            if (this._isCorrectType(newValue, this._elementClass)) {
                this._data.push(newValue);
            } else {
                this._data.push(this._keyClassCreate(
                              this._elSymbol, this._elementClass,
                              newValue, newParameters));
            }

            this.emit('_addedElement', this._data.length - 1);
            this.emit('change', 'add', this._data.length - 1);
        },
        remove: function (index) {
            this._data[index].emit('removeFrom', this);
            this._data.splice(index, 1);
            this.emit('change', 'remove', index);
        }
    });

    var Array_ = Arraylike.extend({});

    var ImmutableObject = Container.extend({
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
        _sift: function (json, parameters) {
            var self = this;
            return this.getKeys().reduce(function (objOut, key) {
                objOut[key] = self._keyClassCreate(
                                   key, self._keyClasses[key], json[key]);
                return objOut;
            }, {});
        },
        get: function (key) {
            return this._data[key];
        },
        _doSet: function (key, newValue, newParameters) {
            var oldVal = this._data[key];

            if (this._schema.hasOwnProperty(key)) {
                if (this._isCorrectType(newValue,
                                          this._keyClasses[key])) {
                    this._data[key] = newValue;
                } else {
                    this._data[key] = this._keyClassCreate(
                                          key, this._keyClasses[key],
                                          newValue, newParameters);
                }

                this.emit('change', 'set', key, this._data[key], oldVal);
            } else {
                console.error('object does not have key (key, schema)');
                console.log(key, this._schema);
            }
        },
        each: function (functionIn, comparatorIn) {
            var self = this,
                keys = this.getKeys();

            if (comparatorIn) {
                keys.sort(comparatorIn);
            }

            keys.forEach(function (key) {
                functionIn(key, self._data[key]);
            });
        },
        isEmpty: function () {
            return Object.keys(this._data).length === 0;
        },
        toJSON: function (ignoreUnused) {
            var data = this._data;
            return this.getKeys().reduce(function (jsonOut, key) {
                if (ignoreUnused !== true || data[key].isUsed()) {
                    jsonOut[key] = data[key].toJSON(ignoreUnused);
                }
                return jsonOut;
            }, {});
        },
        getKeys: function () {
            return Object.keys(this._schema).filter(function (key) {
                return key.charAt(0) !== '@';
            });
        }
    });

    var MutableObject = Arraylike.extend({
        _elSymbol: '?',
        _sift: function (json, parameters) {
            return Object.keys(json).map(function (key) {
                return this._keyClassCreate(
                                   this._elSymbol, this._elementClass,
                                   json[key], {id: key});
            }, this);
        },
        getIDs: function () {
            return this.toArray().map(function (value) {
                return value.getID();
            });
        },
        getByID: function (id) {
            var pos = this.toArray().map(function (value) {
                    return value.getID();
                }).indexOf(id);
            return this.get(pos);
        },
        contains: function (element) {
            return this.toArray().some(function (value) {
                return element === value;
            });
        },
        toJSON: function (ignoreUnused) {
            return this.toArray().reduce(function (jsonOut, element) {
                if (jsonOut.hasOwnProperty(element.getID())) {
                    logError("ID encountered multiple times: " +
                                  element.getID());
                } else {
                    jsonOut[element.getID()] = 
                        element.toJSON(ignoreUnused);
                }
                return jsonOut;
            }, {});
        },
        push: function (newJson, newParameters) {
            if (getType(newParameters) !== Object ||
                    !newParameters.hasOwnProperty('id')) {
                logError('ID should be passed in ' + 
                          'with parameters object');
            } else {
                Array_.push.call(this, newJson, newParameters);
            }
        },
    });

    var Primitive = Base.extend({
        _sift: function (json, parameters) {
            return json;
        },
        get: function () {
            return this._data;
        },
        set: function (newVal) {
            var schema = this._schema;

            function typeMatches(newVal) {
                return getType(newVal) === schema['@type'];
            }

            if (typeMatches(newVal) && this._validate(newVal)) {
                this._data = newVal;
                this.emit('validation', 'succeeded');
                this.emit('change');
            } else if (this.hasError()) {
                this.emit('validation', 'failed');
            } else {
                logError("Setter - new value did not match " +
                          "schema (newVal, schema)");
                logVal(newVal, schema);
            }
        },
        isEmpty: function () {
            if (this._schema['@type'] === Array) {
                return this._data.length === 0;
            } else if (this._schema['@type'] === Object) {
                return Object.keys(this._data).length === 0;
            } else {
                return this._data === this._schema['@type']();
            }
        },
        toJSON: function () {
            return this._data;
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

    function logError(msg) {
        console.error("Barricade: " + msg);
    }

    function logVal(val1, val2) {
        if (val2) {
            console.log(val1, val2);
        } else {
            console.log(val1);
        }
    }

    var BarricadeMain = {};

    BarricadeMain.create = function (schema) {
        function schemaIsMutable() {
            return schema.hasOwnProperty('?');
        }

        function schemaIsImmutable() {
            return Object.keys(schema).some(function (key) {
                return key.charAt(0) !== '@' && key !== '?';
            });
        }

        if (schema['@type'] === Object && schemaIsImmutable()) {
            return ImmutableObject.extend({_schema: schema});
        } else if (schema['@type'] === Object && schemaIsMutable()) {
            return MutableObject.extend({_schema: schema});
        } else if (schema['@type'] === Array && schema.hasOwnProperty('*')) {
            return Array_.extend({_schema: schema});
        } else {
            return Primitive.extend({_schema: schema});
        }
    };

    BarricadeMain.getType = getType; // Very helpful function

    BarricadeMain.Base = Base;
    BarricadeMain.Container = Container;
    BarricadeMain.Array = Array_;
    BarricadeMain.ImmutableObject = ImmutableObject;
    BarricadeMain.MutableObject = MutableObject;
    BarricadeMain.Primitive = Primitive;
    BarricadeMain.Blueprint = Blueprint;
    BarricadeMain.Observable = Observable;
    BarricadeMain.Deferrable = Deferrable;
    BarricadeMain.Omittable = Omittable;
    BarricadeMain.Identifiable = Identifiable;
    BarricadeMain.Enumerated = Enumerated;

    return BarricadeMain;

}());
