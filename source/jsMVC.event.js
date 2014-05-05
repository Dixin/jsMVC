/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    var nativeSilce = Array.prototype.slice,
        _ = jsMVC._,
        Functions = _.Functions,
        returnTrue = _.returnTrue,
        returnFalse = _.returnFalse,
        eventCallbacks = {},
        on = function (eventType, callback) {
            var callbacks = eventCallbacks[eventType];
            if (!callbacks) {
                callbacks = eventCallbacks[eventType] = new Functions();
            }
            callbacks.push(callback);
            return jsMVC;
        },
        off = function (eventType, callback) {
            var callbacks = eventCallbacks[eventType];
            if (callbacks) {
                if (callbacks.remove(callback) === 0) {
                    delete eventCallbacks[eventType];
                }
            }
        },
        trigger = function (eventType) {
            var callbacks = eventCallbacks[eventType];
            if (callbacks) {
                callbacks.execute(callbacks, nativeSilce.call(arguments, 1));
            }
        },
        Event = (function () {
            var constructor = function () {
                this.timeStamp = Date.now();
                this.result = undefined;
            };
            constructor.prototype = {
                constructor: constructor,
                isDefaultPrevented: returnFalse,
                isPropagationStopped: returnFalse,
                isImmediatePropagationStopped: returnFalse,
                isErrorHandled: returnFalse,
                preventDefault: function () {
                    this.isDefaultPrevented = returnTrue;
                },
                stopPropagation: function () {
                    this.isPropagationStopped = returnTrue;
                    this.isImmediatePropagationStopped = returnTrue;
                },
                stopImmediatePropagation: function () {
                    this.isImmediatePropagationStopped = returnTrue;
                },
                handleError: function () {
                    this.isErrorHandled = returnTrue;
                }
            };
            return constructor;
        }());

    // Exports.
    jsMVC.event = Event.prototype,
    jsMVC.on = on;
    jsMVC.off = off,
    _.Event = Event,
    _.trigger = trigger;

}(this.window, !this.window && require, this.jsMVC || exports));
