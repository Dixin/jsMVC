﻿/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>

(function(browser, node, jsMVC, undefined) {

    // Imports
    var nativeHasOwn = Object.prototype.hasOwnProperty,
        // Imports
        _ = jsMVC._,
        error = _.error,
        forEachItem = _.forEachArrayItem,
        forEachKey = _.forEachObjectKey,
        copyProps = _.copyProperties,
        isFunction = _.isFunction,
        isObject = _.isObject,
        isArray = _.isArray,
        indexOf = _.indexOf,
        getArrayValues = _.getArrayValues,
        countKeys = _.countKeys,
        // Local variables.
        eventTypes = {
            change: "change",
            add: "add",
            remove: "remove"
        };

    // Observable

    var fireObservable = function(observable, eventType, newValue, oldValue, key) {
        forEachItem(observable._eventListeners[eventType], function(listener) {
            listener.call(observable, newValue, oldValue, eventType, key);
        });
        if (arguments.length > 4) {
            forEachItem(observable._keyEventListeners[eventType][key], function(listener) {
                listener.call(observable, newValue, oldValue, eventType, key);
            });
        }
    };

    var addObservableKeyEventListener = function(observable, eventType, listener, key) {
        var keyListeners = observable._keyEventListeners[eventType];
        if (!nativeHasOwn.call(keyListeners, key)) {
            keyListeners[key] = [];
        }
        keyListeners[key].push(listener);
    };

    var addObservableEventListener = function(observable, eventType, listener) {
        observable._eventListeners[eventType].push(listener);
    };

    var removeObservableKeyListeners = function(observable, key) {
        forEachKey(observable._keyEventListeners, function(eventType) {
            observable._keyEventListeners[eventType][key] = [];
        });
    };

    var removeObservableKeyEventListeners = function(observable, eventType, key) {
        if (eventType in observable._keyEventListeners) {
            var eventListeners = observable._keyEventListeners[eventType];
            if (key in eventListeners) {
                eventListeners[key] = [];
            }
        }
    };

    var removeObservableEventListener = function(observable, eventType, listener) {
        if (eventType in observable._eventListeners) {
            var eventListeners = observable._eventListeners[eventType];
            for (var index = 0; index < eventListeners.length; index++) {
                if (eventListeners[index] === listener) {
                    eventListeners.splice(index, 1);
                } else {
                    index++;
                }
            }
        }
    };

    var removeObservableEventListeners = function(observable, eventType) {
        var eventListeners = observable._eventListeners;
        if (eventType in eventListeners) {
            eventListeners[eventType] = [];
        }
    };

    var removeObservableKeyEventListener = function(observable, eventType, listener, key) {
        if (eventType in observable._keyEventListeners) {
            var eventListeners = observable._keyEventListeners[eventType];
            if (key in eventListeners) {
                var keyEventListeners = eventListeners[key];
                if (keyEventListeners) {
                    for (var index = 0; index < keyEventListeners.length;) {
                        if (keyEventListeners[index] === listener) {
                            keyEventListeners.splice(index, 1);
                        } else {
                            index++;
                        }
                    }
                }
            }
        }
    };

    var removeObservableListener = function(observable, listener) {
        var index;
        forEachKey(observable._eventListeners, function(eventType, eventListeners) {
            for (index = 0; index < eventListeners.length;) {
                if (eventListeners[index] === listener) {
                    eventListeners.splice(index, 1);
                } else {
                    index++;
                }
            }
        });
        forEachKey(observable._keyEventListeners, function(eventType, eventListeners) {
            forEachKey(eventListeners, function(key, keyListeners) {
                for (index = 0; index < keyListeners.length;) {
                    if (keyListeners[index] === listener) {
                        keyListeners.splice(index, 1);
                    } else {
                        index++;
                    }
                }
            });
        });
    };

    var Observable = (function() {
        var constructor = function(data, asCopy) {
            this.isArray = isArray(data);
            if (!this.isArray && !isObject(data)) {
                error("'data' must be object or array.");
            }
            if (asCopy) {
                this.data = this.isArray ? data.slice() : copyProps({}, data, true);
            } else {
                this.data = data;
            }

            var that = this;

            this._eventListeners = {};
            forEachKey(eventTypes, function(eventType) {
                that._eventListeners[eventType] = [];
            });

            this._keyEventListeners = {};
            forEachKey(eventTypes, function(keyEventType) {
                that._keyEventListeners[keyEventType] = {};
            });
        };

        constructor.prototype = {
            constructor: constructor,

            length: function() {
                return this.isArray ? this.data.length : countKeys(this.data);
            },

            get: function(key) {
                return this.data[key];
            },

            set: function(key, value) {
                if (!nativeHasOwn.call(this.data, key)) {
                    error("Key or index '" + key + "' must be existing.");
                }
                var oldValue = this.data[key];
                if (oldValue !== value) {
                    this.data[key] = value;
                    fireObservable(this, eventTypes.change, value, oldValue, key);
                }
                return this;
            },

            add: function() {
                var args = arguments,
                    key,
                    value,
                    length = args.length;
                if (length < 2) {
                    // add(item) for aray.
                    if (!this.isArray) {
                        error("Key and Value must be provided for object.");
                    }
                    key = this.data.length;
                    value = args[0];
                    this.data.push(value);
                    fireObservable(this, eventTypes.add, value, undefined, key);
                } else if (length === 2) {
                    // add(key, value) for object.
                    if (this.isArray) {
                        error("Key must not be provided for array.");
                    }
                    key = args[0];
                    if (nativeHasOwn.call(this.data, key)) {
                        error("Key '" + key + "' must be unique.");
                    }
                    value = args[1];
                    this.data[key] = value;
                    fireObservable(this, eventTypes.add, value, undefined, key);
                } else {
                    // add(key, getter, dependencies)
                    if (this.isArray) {
                        error("Dependency must be used for object.");
                    }
                    key = args[0];
                    var getter = args[1];
                    var dependentKeys = args[2];
                    value = getter.apply(this, getArrayValues(this.data, dependentKeys));
                    this.data[key] = value;
                    this.on(eventTypes.change, function(newValue, oldValue, eventType, changedKey) {
                        if (indexOf(dependentKeys, changedKey) >= 0) {
                            this.set(key, getter.apply(this, getArrayValues(this.data, dependentKeys)));
                        }
                    });
                    fireObservable(this, eventTypes.add, value, undefined, key);
                }

                return this;
            },

            push: function(item) {
                return this.add(item);
            },

            pop: function() {
                if (!this.isArray) {
                    error("Popping an item must be used for array.");
                }
                var item = this.data[this.data.length - 1];
                this.removeAt(this.data.length - 1);
                return item;
            },

            addAt: function(index, item) {
                if (!this.isArray) {
                    error("Adding item at an index must be used for array.");
                }
                if (index > this.data.length) {
                    error("'index' must not be greater than array's length");
                }
                this.data.splice(index, 0, item);
                fireObservable(this, eventTypes.add, item, undefined, index);
                return this;
            },

            remove: function() {
                var args = arguments,
                    key,
                    value;
                if (this.isArray) {
                    // remove(item) for array.
                    value = args[0];
                    for (key = 0; key < this.data.length; key++) {
                        if (this.data[key] === value) {
                            this.data.splice(key, 1);
                            fireObservable(this, eventTypes.remove, undefined, value, key);
                            removeObservableKeyListeners(this, key);
                            break;
                        }
                    }
                } else {
                    // remove(key) for object.
                    key = args[0];
                    value = this.data[key];
                    delete this.data[key];
                    fireObservable(this, eventTypes.remove, undefined, value, key);
                    removeObservableKeyListeners(this, key);
                }
                return this;
            },

            removeAll: function(keys) {
                var index;

                if (this.isArray) {
                    if (arguments.length < 1) {
                        // removeAll() for array.
                        keys = [];
                        for (index = this.data.length - 1; index >= 0; index--) {
                            keys.push(index);
                        }
                    } else {
                        // removeAll(indexes) for array.
                        keys.sort(function(a, b) {
                            return b - a;
                        });
                    }
                    for (index = 0; index < keys.length; index++) {
                        this.removeAt(keys[index]);
                    }
                } else {
                    if (arguments.length < 1) {
                        // removeAll() for object.
                        keys = [];
                        forEachKey(this.data, function(key) {
                            keys.push(key);
                        });
                    }
                    // removeAll(keys) for object.
                    forEachItem(keys, function(key) {
                        this.remove(key);
                    });
                }
            },

            removeAt: function(index) {
                if (!this.isArray) {
                    error("Removing item at an index must be used for array.");
                }
                if (index > this.data.length) {
                    error("'index' must not be out of array's range.");
                }
                var value = this.data[index];
                this.data.splice(index, 1);
                fireObservable(this, eventTypes.remove, undefined, value, index);
                removeObservableKeyListeners(this, index);
            },

            on: function(eventType, listener, key) { // listener: (newValue, oldValue, event, key)
                if (arguments.length < 3) {
                    // on(eventType, listener)
                    if (!isFunction(eventType)) {
                        addObservableEventListener(this, eventType.toLowerCase(), listener);
                        return this;
                    }

                    // on(listener, key) -> on("change", listener, key)
                    key = listener;
                    listener = eventType;
                    eventType = eventTypes.change;
                }
                // on(eventType, listener, key)
                addObservableKeyEventListener(this, eventType.toLowerCase(), listener, key);
                return this;
            },

            off: function() {
                var args = arguments,
                    listener = args[0],
                    key;

                if (isFunction(listener)) {
                    // off(listener)
                    removeObservableListener(this, listener);
                } else {
                    var eventType = listener.toLowerCase();
                    if (args.length > 2) {
                        // off(eventType, listener, key)
                        listener = args[1];
                        key = args[2];
                        removeObservableKeyEventListener(this, eventType, listener, key);
                    } else if (args.length === 2) {
                        listener = args[1];
                        if (isFunction(listener)) {
                            // off(eventType, listener)
                            removeObservableEventListener(this, eventType, listener);
                        } else {
                            // off(eventType, key)
                            key = listener;
                            removeObservableKeyEventListeners(this, eventType, key);
                        }
                    } else {
                        // off(eventType)
                        removeObservableEventListeners(this, eventType);
                    }
                }
                return this;
            },

            forEach: function(callback, context) {
                if (arguments.length < 2) {
                    context = this;
                }
                if (this.isArray) {
                    forEachItem(this.data, callback, context);
                } else {
                    forEachKey(this.data, callback, context);
                }
            },
            
            sort: function (callback) {
                // TODO: Implement.
            }
        };
        return constructor;
    }());

    var isObservable = function(object) {
        return object && object.constructor === Observable;
    };

    var getValue = function(data, key) {
        return isObservable(data) ? data.get(key) : data[key];
    };

    // /Observable

    // Exports
    jsMVC.Observable = function(data) {
        return new Observable(data);
    };
    jsMVC.Observable.eventTypes = eventTypes;
    jsMVC.isObservable = isObservable;
    
    _.getValue = getValue;
    // /Exports

}(this.window, !this.window && require, this.jsMVC || exports));