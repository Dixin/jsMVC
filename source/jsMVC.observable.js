/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    // Imports
    var nativeHasOwn = Object.prototype.hasOwnProperty,
        // Imports
        _ = jsMVC._,
        error = _.error,
        forEachItem = _.forEachItem,
        forEachKey = _.forEachKey,
        copyProps = _.copyProperties,
        isFunction = _.isFunction,
        isObject = _.isObject,
        isArray = _.isArray,
        isString = _.isString,
        indexOf = _.indexOf,
        getArrayValues = _.getArrayValues,
        countKeys = _.countKeys,
        // Local variables.
        eventTypes = {
            change: "change",
            add: "add",
            remove: "remove"
        },

        triggerListeners = function (observable, eventType, newValue, oldValue, key) {
            forEachItem(observable._eventListeners[eventType], function (listener) {
                listener.call(observable, newValue, oldValue, eventType, key);
            });
            if (arguments.length > 4) {
                forEachItem(observable._keyListeners[eventType][key], function (listener) {
                    listener.call(observable, newValue, oldValue, eventType, key);
                });
            }
        },

        addKeyListener = function (observable, eventType, listener, key) {
            var keyListeners = observable._keyListeners[eventType];
            if (!nativeHasOwn.call(keyListeners, key)) {
                keyListeners[key] = [];
            }
            keyListeners[key].push(listener);
        },

        addEventListener = function (observable, eventType, listener) {
            observable._eventListeners[eventType].push(listener);
        },

        removeKeyListeners = function (observable, key) {
            forEachKey(observable._keyListeners, function (eventType) {
                observable._keyListeners[eventType][key] = [];
            });
        },

        removeKeyListenersByEvent = function (observable, eventType, key) {
            var eventListeners = observable._keyListeners[eventType];
            if (eventListeners) {
                if (key in eventListeners) {
                    eventListeners[key] = [];
                }
            }
        },

        removeEventListener = function (observable, eventType, listener) {
            var eventListeners = observable._eventListeners[eventType],
                index;
            if (eventListeners) {
                for (index = 0; index < eventListeners.length; index++) {
                    if (eventListeners[index] === listener) {
                        eventListeners.splice(index, 1);
                    } else {
                        index++;
                    }
                }
            }
        },

        removeEventListeners = function (observable, eventType) {
            var eventListeners = observable._eventListeners;
            if (eventType in eventListeners) {
                eventListeners[eventType] = [];
            }
        },

        removeKeyListenerByEvent = function (observable, eventType, listener, key) {
            var eventListeners = observable._keyListeners[eventType],
                keyListeners,
                index;
            if (eventListeners) {
                keyListeners = eventListeners[key];
                if (keyListeners) {
                    for (index = 0; index < keyListeners.length;) {
                        if (keyListeners[index] === listener) {
                            keyListeners.splice(index, 1);
                        } else {
                            index++;
                        }
                    }
                }
            }
        },

        removeListener = function (observable, listener) {
            var index;
            forEachKey(observable._eventListeners, function (eventType, eventListeners) {
                for (index = 0; index < eventListeners.length;) {
                    if (eventListeners[index] === listener) {
                        eventListeners.splice(index, 1);
                    } else {
                        index++;
                    }
                }
            });
            forEachKey(observable._keyListeners, function (eventType, eventListeners) {
                forEachKey(eventListeners, function (key, keyListeners) {
                    for (index = 0; index < keyListeners.length;) {
                        if (keyListeners[index] === listener) {
                            keyListeners.splice(index, 1);
                        } else {
                            index++;
                        }
                    }
                });
            });
        },

        Observable = (function () {
            var constructor = function (data, asCopy) {
                this.isArray = isArray(data);
                if (!this.isArray && !isObject(data)) {
                    error("'data' must be object or array.");
                }
                if (asCopy) {
                    this.data = this.isArray ? data.slice() : copyProps({}, data);
                } else {
                    this.data = data;
                }

                var that = this;

                this._eventListeners = {};
                forEachKey(eventTypes, function (eventType) {
                    that._eventListeners[eventType] = [];
                });

                this._keyListeners = {};
                forEachKey(eventTypes, function (eventType) {
                    that._keyListeners[eventType] = {};
                });
            };

            constructor.prototype = {
                constructor: constructor,

                length: function () {
                    return this.isArray ? this.data.length : countKeys(this.data);
                },

                get: function (key) {
                    return this.data[key];
                },

                set: function (key, value) {
                    if (!nativeHasOwn.call(this.data, key)) {
                        error("Key or index '" + key + "' must be existing.");
                    }
                    var oldValue = this.data[key];
                    if (oldValue !== value) {
                        this.data[key] = value;
                        triggerListeners(this, eventTypes.change, value, oldValue, key);
                    }
                    return this;
                },

                add: function () { // TODO: Consider merging with set.
                    var args = arguments,
                        key,
                        value,
                        length = args.length,
                        getter,
                        dependentKeys;
                    if (length < 2) {
                        // add(item) for aray.
                        if (!this.isArray) {
                            error("Key and Value must be provided for object.");
                        }
                        key = this.data.length;
                        value = args[0];
                        this.data.push(value);
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
                    } else {
                        // add(key, getter, dependencies)
                        if (this.isArray) {
                            error("Dependency must be used for object.");
                        }
                        key = args[0];
                        getter = args[1];
                        dependentKeys = args[2];
                        value = getter.apply(this, getArrayValues(this.data, dependentKeys));
                        this.data[key] = value;
                        this.on(eventTypes.change, function (newValue, oldValue, eventType, changedKey) {
                            if (indexOf(dependentKeys, changedKey) >= 0) {
                                this.set(key, getter.apply(this, getArrayValues(this.data, dependentKeys)));
                            }
                        });
                    }
                    triggerListeners(this, eventTypes.add, value, undefined, key);
                    return this;
                },

                push: function (item) {
                    return this.add(item);
                },

                pop: function () {
                    if (!this.isArray) {
                        error("Popping an item must be used for array.");
                    }
                    var item = this.data[this.data.length - 1];
                    this.removeAt(this.data.length - 1);
                    return item;
                },

                addAt: function (index, item) {
                    if (!this.isArray) {
                        error("Adding item at an index must be used for array.");
                    }
                    if (index > this.data.length) {
                        error("'index' must not be greater than array's length");
                    }
                    this.data.splice(index, 0, item);
                    triggerListeners(this, eventTypes.add, item, undefined, index);
                    return this;
                },

                remove: function () {
                    var args = arguments,
                        key,
                        value;
                    if (this.isArray) {
                        // remove(item) for array.
                        value = args[0];
                        for (key = 0; key < this.data.length; key++) {
                            if (this.data[key] === value) {
                                this.data.splice(key, 1);
                                triggerListeners(this, eventTypes.remove, undefined, value, key);
                                removeKeyListeners(this, key);
                                break;
                            }
                        }
                    } else {
                        // remove(key) for object.
                        key = args[0];
                        value = this.data[key];
                        delete this.data[key];
                        triggerListeners(this, eventTypes.remove, undefined, value, key);
                        removeKeyListeners(this, key);
                    }
                    return this;
                },

                removeAll: function (keys) {
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
                            keys.sort(function (a, b) {
                                return b - a;
                            });
                        }
                        forEachItem(keys, this.removeAt);
                    } else {
                        if (arguments.length < 1) {
                            // removeAll() for object.
                            keys = [];
                            forEachKey(this.data, function (key) {
                                keys.push(key);
                            });
                        }
                        // removeAll(keys) for object.
                        forEachItem(keys, this.remove);
                    }
                },

                removeAt: function (index) {
                    if (!this.isArray) {
                        error("Removing item at an index must be used for array.");
                    }
                    if (index > this.data.length) {
                        error("'index' must not be out of array's range.");
                    }
                    var value = this.data[index];
                    this.data.splice(index, 1);
                    triggerListeners(this, eventTypes.remove, undefined, value, index);
                    removeKeyListeners(this, index);
                },

                on: function (eventType, listener, key) { // listener: function (newValue, oldValue, event, key) {}
                    if (arguments.length < 3) {
                        // on(eventType, listener)
                        if (isString(eventType)) {
                            addEventListener(this, eventType.toLowerCase(), listener);
                            return this;
                        }

                        // on(listener, key) -> on("change", listener, key)
                        key = listener;
                        listener = eventType;
                        eventType = eventTypes.change;
                    }
                    // on(eventType, listener, key)
                    addKeyListener(this, eventType.toLowerCase(), listener, key);
                    return this;
                },

                off: function () {
                    var args = arguments,
                        listener = args[0],
                        key,
                        eventType;

                    if (isFunction(listener)) {
                        // off(listener)
                        removeListener(this, listener);
                        return this;
                    }

                    eventType = listener.toLowerCase();
                    if (args.length > 2) {
                        // off(eventType, listener, key)
                        listener = args[1];
                        key = args[2];
                        removeKeyListenerByEvent(this, eventType, listener, key);
                    } else if (args.length === 2) {
                        listener = args[1];
                        if (isFunction(listener)) {
                            // off(eventType, listener)
                            removeEventListener(this, eventType, listener);
                        } else {
                            // off(eventType, key)
                            key = listener;
                            removeKeyListenersByEvent(this, eventType, key);
                        }
                    } else {
                        // off(eventType)
                        removeEventListeners(this, eventType);
                    }
                    return this;
                },

                forEach: function (callback, context) {
                    if (arguments.length < 2) {
                        context = this;
                    }
                    if (this.isArray) {
                        forEachItem(this.data, callback, context);
                    } else {
                        forEachKey(this.data, callback, context);
                    }
                },

                sort: function (compare) {
                    if (!this.isArray) {
                        error("Sorting must be used for array.");
                    }

                    var backup = this.data;
                    this.removeAll();
                    backup.sort(compare);
                    forEachItem(backup, this.push);
                },

                reverse: function () {
                    if (!this.isArray) {
                        error("Reversing must be used for array.");
                    }

                    var backup = this.data;
                    this.removeAll();
                    backup.reverse();
                    forEachItem(backup, this.push);
                }
            };
            return constructor;
        }()),

        isObservable = function (object) {
            return object && object.constructor === Observable;
        },

        getValue = function (data, key) {
            return isObservable(data) ? data.get(key) : data[key];
        };

    // Exports
    jsMVC.Observable = function (data) {
        return new Observable(data);
    };
    jsMVC.Observable.eventTypes = eventTypes;
    jsMVC.isObservable = isObservable;

    _.getValue = getValue;
    // /Exports

}(this.window, !this.window && require, this.jsMVC || exports));
