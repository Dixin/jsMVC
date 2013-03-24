/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";

    var nativeSilce = Array.prototype.slice,
        _ = jsMVC._,
        error = _.error,
        forEachItem = _.forEachArrayItem,
        isFunction = _.isFunction,
        Callbacks = (function() {
            var constructor = function() {
                this.callbacks = [];
            };

            constructor.prototype = {
                constructor: constructor,

                push: function(callback) {
                    if (!isFunction(callback)) {
                        error("'callback' must be function.");
                    }
                    return this.callbacks.push(callback);
                },

                execute: function() {
                    var args = arguments;
                    forEachItem(this.callbacks, function(callback) {
                        callback.apply(undefined, args);
                    });
                },

                remove: function(callback) {
                    if (callback === undefined) {
                        // Remove all items.
                        this.callbacks = [];
                    } else {
                        forEachItem(this.callbacks, function(item, index, callbacks) {
                            if (item === callback) {
                                callbacks.splice(index, 1); // Remove item.
                                return true; // break.
                            }
                            return false;
                        });
                    }
                    return this.callbacks.length;
                }
            };

            return constructor;
        }()),
        eventCallbacks = {},
        on = function(eventType, callback) {
            var callbacks = eventCallbacks[eventType];
            if (!callbacks) {
                callbacks = eventCallbacks[eventType] = new Callbacks();
            }
            callbacks.push(callback);
            return jsMVC;
        },
        off = function(eventType, callback) {
            var callbacks = eventCallbacks[eventType];
            if (callbacks) {
                if (callbacks.remove(callback) === 0) {
                    delete eventCallbacks[eventType];
                }
            }
        },
        trigger = function(eventType) {
            var callbacks = eventCallbacks[eventType];
            if (callbacks) {
                callbacks.execute.apply(callbacks, nativeSilce.call(arguments, 1));
            }
        },
        Event = (function() {
            var constructor = function() {
                this.timeStamp = Date.now();
            };
            constructor.prototype = {
                constructor: constructor
            };
            return constructor;
        }());

    jsMVC.event = Event.prototype,
    jsMVC.on = on;
    jsMVC.off = off,
    _.Event = Event,
    _.trigger = trigger;

}(this.window, !this.window && require, this.jsMVC || exports));
