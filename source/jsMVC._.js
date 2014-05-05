/// <reference path="jsMVC.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    // Imports.
    var nativeHasOwn = Object.prototype.hasOwnProperty,
        nativeToString = Object.prototype.toString,
        nativeKeys = Object.keys,
        nativeMap = Array.prototype.map,
        nativeSome = Array.prototype.some,
        nativeReduceRight = Array.prototype.reduceRight,
        nativeIndexOf = Array.prototype.indexOf,
        // Local variables.
        noop = function () {
        },
        error = function (message) {
            throw new Error(message);
        },
        // Array helpers.
        forEachItem = function (array, callback, context) {
            // Array.prototype.forEach cannot break.
            var index,
                length;
            if (!array) {
                return array;
            }
            length = array.length;
            for (index = 0; index < length; index++) {
                if (nativeHasOwn.call(array, index)) {
                    if (callback.call(context, array[index], index, array) === false) {
                        break;
                    }
                }
            }
            return array;
        },
        map = nativeMap ? function (array, callback, context) {
            return nativeMap.call(array, callback, context);
        } : function (array, callback, context) {
            var index,
                results = new Array(array.length);
            for (index = 0; index < results.length; index++) {
                if (index in array) {
                    results[index] = callback.call(context, array[index], index, array);
                }
            }
            return results;
        },
        reduceRight = nativeReduceRight ? function (array, callback, initial) {
            return nativeReduceRight.call(array, callback, initial);
        } : function (array, callback, initial) {
            var length = array.length,
                hasInitial = arguments.length > 2,
                accumulator,
                lastIndex,
                index;
            if (length === 0 && !hasInitial) {
                error("Empty array must not be reduced with no initial value.");
            }
            accumulator = hasInitial ? initial : array[length - 1];
            lastIndex = hasInitial ? length - 1 : length - 2;
            for (index = lastIndex; index >= 0; index--) {
                accumulator = callback.call(undefined, accumulator, array[index], index, array);
            }
            return accumulator;
        },
        some = nativeSome ? function (array, callback, context) {
            return nativeSome.call(array, callback, context);
        } : function (array, callback, context) {
            var index,
                length = array.length;
            for (index = 0; index < length; index++) {
                if (nativeHasOwn.call(array, index) && callback.call(context, array[index], index, array)) {
                    return true;
                }
            }
            return false;
        },
        indexOf = nativeIndexOf ? function (array, item) {
            return nativeIndexOf.call(array, item);
        } : function (array, item) {
            var index,
                length = array.length;
            for (index = 0; index < length; index++) {
                if (array[index] === item) {
                    return index;
                }
            }
            return -1;
        },
        values = function (array, keys) {
            var index,
                length = keys.length,
                results = new Array(length);
            for (index = 0; index < length; index++) {
                results[index] = array[keys[index]];
            }
            return results;
        },
        // Object helpers.
        hasKeyIgnoredBug = !({
            toString: null
        }).propertyIsEnumerable("toString"), // IE6

        ignoredKeys = [// IE6
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        ignoredKeysLength = hasKeyIgnoredBug.length, // IE6

        forEachKey = nativeKeys ? function (object, callback, context) {
            if (!object) {
                return;
            }
            forEachItem(nativeKeys(object), function (key) {
                return callback.call(context, key, object[key], object);
            });
        } : (hasKeyIgnoredBug ? function (object, callback, context) { // IE6
            // https//developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
            var key,
                index;
            if (!object) {
                return;
            }
            for (key in object) {
                if (nativeHasOwn.call(object, key)) {
                    if (callback.call(context, key, object[key], object) === false) {
                        break;
                    }
                }
            }
            for (index = 0; index < ignoredKeysLength; index++) {
                key = ignoredKeys[index];
                if (nativeHasOwn.call(object, key) && callback.call(context, key, object[key], object) === false) {
                    break;
                }
            }
        } : function (object, callback, context) {
            var key;
            if (!object) {
                return;
            }
            for (key in object) {
                if (nativeHasOwn.call(object, key) && callback.call(context, key, object[key], object) === false) {
                    break;
                }
            }
        }),
        copyProps = function (destination, source, canOverride) {
            forEachKey(source, function (key, value) {
                if (!canOverride && (key in destination)) {
                    error("Key '" + key + "' must be unique.");
                }
                destination[key] = value;
            });
            return destination;
        },
        countKeys = function (object) {
            var count = 0,
                key;
            for (key in object) {
                if (nativeHasOwn.call(object, key)) {
                    count++;
                }
            }
            return count;
        },
        // Type helpers.
        typeMap = reduceRight(["Boolean", "Number", "String", "Function", "Array", "Date", "RegExp", "Object"], function (accumulator, item) {
            accumulator["[object " + item + "]"] = item.toLowerCase();
            return accumulator;
        }, {}),
        type = function (value) {
            switch (value) {
                case null:
                    return "null";
                case undefined:
                    return "undefined";
                default:
                    // 0, "", false
                    // NaN -> "number", the same as jQuery
                    return typeMap[nativeToString.call(value)] || "object";
            }
        },
        isString = function (value) {
            return type(value) === "string";
        },
        isFunction = function (value) {
            return type(value) === "function";
        },
        isObject = function (value) {
            return type(value) === "object";
        },
        isInteger = function (value) {
            return !isNaN(parseInt(value, 10)) && isFinite(value);
        },
        isArray = Array.isArray || function (value) {
            return type(value) === "array";
        },
        isNumber = function (value) {
            return type(value) === "number";
        },
        isWindow = function (value) {
            return value && value === value.window;
        },
        // Function group.
        Functions = (function () {
            var constructor = function () {
                this.fns = [];
            };

            constructor.prototype = {
                constructor: constructor,

                push: function (fn) {
                    if (!isFunction(fn)) {
                        error("'callback' must be function.");
                    }
                    return this.fns.push(fn);
                },

                execute: function (context, args) {
                    var isExecuted = false;
                    forEachItem(this.fns, function (callback) {
                        callback.apply(context, args); // Should not return.
                        isExecuted = true;
                    });
                    return isExecuted;
                },

                remove: function (fn) {
                    if (fn === undefined) {
                        // Remove all items.
                        this.fns = [];
                    } else {
                        forEachItem(this.fns, function (item, index, fns) {
                            if (item === fn) {
                                fns.splice(index, 1); // Remove item.
                                return false; // break.
                            }
                            return true;
                        });
                    }
                    return this.fns.length;
                }
            };

            return constructor;
        }()),
        returnTrue = function () {
            return true;
        },
        returnFalse = function () {
            return false;
        };

    // Exports.
    jsMVC._ = {
        noop: noop,
        error: error,
        forEachItem: forEachItem,
        indexOf: indexOf,
        some: some,
        reduceRight: reduceRight,
        map: map,
        getArrayValues: values,
        forEachKey: forEachKey,
        copyProperties: copyProps,
        countKeys: countKeys,
        type: type,
        isString: isString,
        isFunction: isFunction,
        isObject: isObject,
        isInteger: isInteger,
        isNumber: isNumber,
        isArray: isArray,
        isWindow: isWindow,
        Functions: Functions,
        returnTrue: returnTrue,
        returnFalse: returnFalse
    };

}(this.window, !this.window && require, this.jsMVC || exports));
