// jsMVC JavaScript library implements routing and MVC for browser (single page application) and server side (nodejs) development.
// http://jsMVC.net
//
// v0.8 preview
// Jan 14 2013 GMT-08
//
// Copyright (C) 2013 - 2014 Dixin Yan http://weblogs.asp.net/dixin
// Released under the MIT license

(function (browser, node, undefined) {
    "use strict";

    // Imports.
    var nativeSilce = Array.prototype.slice,
        previous = browser && browser.jsMVC,
        jQuery = browser && browser.jQuery,
        // Local variables.
        jsMVC = function (options) {
            return jsMVC.config(options);
        };

    jsMVC.version = 0.8;

    jsMVC.noConflict = function () {
        if (browser && browser.jsMVC === jsMVC) {
            // Old value of window.jsMVC is saved. Calling noConflict() restores it.
            browser.jsMVC = previous;
        }
        return jsMVC;
    };

    // Define AMD module. http://requirejs.org/docs/whyamd.html
    if (typeof define === "function" && define.amd) {
        define("jsMVC", [], function () {
            return jsMVC;
        });
    }

    // Define jQuery plugin. http://docs.jquery.com/Plugins/Authoring#Namespacing
    if (jQuery) {
        // jQuery.namespace(method, args), not jQuery.namespace.method(args).
        jQuery.jsMVC = function (name) {
            var prop = jsMVC[name];
            if (prop) {
                return prop.apply(undefined, nativeSilce.call(arguments, 1));
            }
            return undefined;
        };
    }

    // Export to browser window.
    if (browser) {
        browser.jsMVC = jsMVC;
    }

    // Export to node.js. function (exports, require, module, __filename, __dirname) { }
    if (node) {
        exports = jsMVC;
        if (typeof module !== "undefined" && module.exports) {
            module.exports = jsMVC;
        }
    }
}(this.window, !this.window && require));

﻿/// <reference path="jsMVC.js"/>

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

﻿/// <reference path="jsMVC.js"/>
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

﻿/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    // Imports.
    var nativeHasOwn = Object.prototype.hasOwnProperty,
        _ = jsMVC._,
        noop = _.noop,
        error = _.error,
        forEachKey = _.forEachKey,
        some = _.some,
        isString = _.isString,
        isFunction = _.isFunction,
        isObject = _.isObject,
        copyProps = _.copyProperties,
        // Local variables.
        separatorType = "separator",
        contentType = "content",
        literalType = "literal",
        parameterType = "parameter",
        separator = "/",
        catchAllFlag = "*",
        openingFlag = "{",
        closingFlag = "}",
        doubleOpeningFlag = "{{",
        doubleClosingFlag = "}}",
        emptyString = "",
        // Route parser.
        getSegmentLiteral = function (segmentLiteral) {
            // Scan for errant single { and } and convert double {{ to { and double }} to }
            // First we eliminate all escaped braces and then check if any other braces are remaining
            var newLiteral = segmentLiteral.replace(doubleOpeningFlag, emptyString).replace(doubleClosingFlag, emptyString);
            if (newLiteral.indexOf(openingFlag) !== -1 || newLiteral.indexOf(closingFlag) !== -1) {
                return null;
            }
            // If it's a valid format, we unescape the braces
            return segmentLiteral.replace(doubleOpeningFlag, openingFlag).replace(doubleClosingFlag, closingFlag);
        },
        isParameterNameValid = function (parameterName) {
            var index,
                character;
            if (parameterName.length === 0) {
                return false;
            }
            for (index = 0; index < parameterName.length; index++) {
                character = parameterName[index];
                if (character === separator || character === openingFlag || character === closingFlag) {
                    return false;
                }
            }
            return true;
        },
        getIndexOfFirstOpenParameter = function (segment, startIndex) {
            // Find the first unescaped open brace
            while (true) {
                startIndex = segment.indexOf(openingFlag, startIndex);
                if (startIndex === -1) {
                    // If there are no more open braces, stop
                    return -1;
                }
                if ((startIndex + 1 === segment.length) ||
                    ((startIndex + 1 < segment.length) && (segment.charAt(startIndex + 1) !== openingFlag))) {
                    // If we found an open brace that is followed by a non-open brace, it's
                    // a parameter delimiter.
                    // It's also a delimiter if the open brace is the last character - though
                    // it ends up being being called out as invalid later on.
                    return startIndex;
                }
                // Increment by two since we want to skip both the open brace that
                // we're on as well as the subsequent character since we know for
                // sure that it is part of an escape sequence.
                startIndex += 2;
            }
        },
        ParameterSubsegment = function (parameterName) {
            this.isCatchAll = false;
            if (parameterName.charAt(0) === catchAllFlag) {
                parameterName = parameterName.substr(1);
                this.isCatchAll = true;
            }

            this.type = parameterType;
            this.value = parameterName;
        },
        getUrlSubsegments = function (part) {
            var startIndex = 0,
                pathSubsegments = [],
                nextParameterStart,
                lastLiteralPart,
                nextParameterEnd,
                literalPart,
                parameterName;
            while (startIndex < part.length) {
                nextParameterStart = getIndexOfFirstOpenParameter(part, startIndex);
                if (nextParameterStart === -1) {
                    // If there are no more parameters in the segment, capture the remainder as a literal and stop
                    lastLiteralPart = getSegmentLiteral(part.substr(startIndex));
                    if (lastLiteralPart === null) {
                        return null;
                    }
                    if (lastLiteralPart.length > 0) {
                        pathSubsegments.push({
                            type: literalType,
                            value: lastLiteralPart
                        });
                    }
                    break;
                }

                nextParameterEnd = part.indexOf(closingFlag, nextParameterStart + 1);
                if (nextParameterEnd === -1) {
                    return null;
                }

                literalPart = getSegmentLiteral(part.substr(startIndex, nextParameterStart - startIndex));
                if (literalPart === null) {
                    return null;
                }
                if (literalPart.length > 0) {
                    pathSubsegments.push({
                        type: literalType,
                        value: literalPart
                    });
                }

                parameterName = part.substr(nextParameterStart + 1, nextParameterEnd - nextParameterStart - 1);
                pathSubsegments.push(new ParameterSubsegment(parameterName));

                startIndex = nextParameterEnd + 1;
            }

            return pathSubsegments;
        },
        getUrlParts = function (url) {
            var parts = [],
                currentIndex,
                indexOfNextSeparator,
                nextPart;
            if (!url || url.length === 0) {
                return parts;
            }

            currentIndex = 0;
            // Split the incoming URL into individual parts.
            while (currentIndex < url.length) {
                indexOfNextSeparator = url.indexOf(separator, currentIndex);
                if (indexOfNextSeparator === -1) {
                    // If there are no more separators, the rest of the string is the last part.
                    var finalPart = url.substring(currentIndex);
                    if (finalPart.length > 0) {
                        parts.push(finalPart);
                    }
                    break;
                }

                nextPart = url.substr(currentIndex, indexOfNextSeparator - currentIndex);
                if (nextPart.length > 0) {
                    parts.push(nextPart);
                }
                parts.push(separator);
                currentIndex = indexOfNextSeparator + 1;
            }

            return parts;
        },
        getUrlSegments = function (urlParts) {
            var pathSegments = [],
                index,
                pathSegment,
                isCurrentPartSeparator;

            for (index = 0; index < urlParts.length; ++index) {
                pathSegment = urlParts[index];
                isCurrentPartSeparator = pathSegment === separator;
                if (isCurrentPartSeparator) {
                    pathSegments.push({
                        type: separatorType,
                        value: separator
                    });
                } else {
                    var subsegments = getUrlSubsegments(pathSegment);
                    pathSegments.push({
                        type: contentType,
                        value: subsegments
                    });
                }
            }
            return pathSegments;
        },
        isSegmentCatchAll = function (segment) {
            return some(segment.value, function (subsegment) {
                return subsegment.type === parameterType && subsegment.isCatchAll;
            });
        },
        isUrlSubsegmentsValid = function (pathSubsegments, usedParameterNames) {
            var segmentContainsCatchAll = false,
                previousSegmentType,
                index,
                subsegment,
                parameterSubsegment,
                parameterName;

            for (index = 0; index < pathSubsegments.length; ++index) {
                subsegment = pathSubsegments[index];
                if (previousSegmentType === subsegment.type) {
                    // 2 literal or parameter subsegments does not make sense and should not be allowed.
                    return false;
                }
                previousSegmentType = subsegment.type;

                // Nothing to validate for literals - everything is valid
                if (subsegment.type !== literalType) {
                    if (subsegment.type === parameterType) {
                        parameterSubsegment = subsegment;
                        parameterName = parameterSubsegment.value;

                        if (parameterSubsegment.isCatchAll) {
                            segmentContainsCatchAll = true;
                        }

                        // Check for valid characters in the parameter name
                        if (!isParameterNameValid(parameterName)) {
                            return false;
                        }

                        if (usedParameterNames[parameterName]) {
                            return false;
                        } else {
                            usedParameterNames[parameterName] = parameterSubsegment;
                        }
                    } else {
                        return false;
                    }
                }
            }

            if (segmentContainsCatchAll && (pathSubsegments.length !== 1)) {
                return false;
            }

            return true;
        },
        isParameterSubsegmentCatchAll = function (subsegment) {
            return subsegment.isCatchAll === true;
        },
        isUrlPartsValid = function (parts) {
            var usedParameterNames = {},
                isPreviousPartSeparator = null,
                foundCatchAllParameter = false,
                index,
                part,
                isCurrentPartSeparator,
                subsegments;

            for (index = 0; index < parts.length; ++index) {
                part = parts[index];
                if (foundCatchAllParameter) {
                    // If we ever start an iteration of the loop and we've already found a
                    // catchall parameter then we have an invalid URL format.
                    return false;
                }

                if (isPreviousPartSeparator === null) {
                    // Prime the loop with the first value
                    isPreviousPartSeparator = part === separator;
                    isCurrentPartSeparator = isPreviousPartSeparator;
                } else {
                    isCurrentPartSeparator = part === separator;

                    // If both the previous part and the current part are separators, it's invalid
                    if (isCurrentPartSeparator && isPreviousPartSeparator) {
                        return false;
                    }
                    isPreviousPartSeparator = isCurrentPartSeparator;
                }

                // If it's not a separator, parse the segment for parameters and validate it
                if (!isCurrentPartSeparator) {
                    subsegments = getUrlSubsegments(part);
                    if (subsegments === null) {
                        return false;
                    }

                    if (!isUrlSubsegmentsValid(subsegments, usedParameterNames)) {
                        return false;
                    }

                    foundCatchAllParameter = some(subsegments, isParameterSubsegmentCatchAll);
                }
            }
            return true;
        },
        getParsedSegments = function (routeUrl) {
            var urlParts,
                pathSegments;
            if (!routeUrl) {
                routeUrl = emptyString;
            }

            if (routeUrl[0] === separator || routeUrl.indexOf('?') !== -1) {
                return null;
            }

            urlParts = getUrlParts(routeUrl);
            if (!isUrlPartsValid(urlParts)) {
                return null;
            }

            pathSegments = getUrlSegments(urlParts);
            return pathSegments;
        },
        // /Route parser.

        // RouteValueDictionary.
        getRouteValues = function (values) {
            var routeValues;
            if (!values) {
                return {};
            }
            if (!isObject(values)) {
                error("'values' must be plain object.");
            }
            routeValues = {};
            forEachKey(values, function (key, value) {
                key = key.toLowerCase();
                if (nativeHasOwn.call(routeValues, key)) {
                    error("Keys of 'values' must be case-insensitively unique.");
                }
                routeValues[key] = value;
            });
            return routeValues;
        },
        // /RouteValueDictionary.

        // Parsed route.
        matchCatchAllSegment = function (contentPathSegment, remainingRequestSegments, defaultValues, matchedValues) {
            var remainingRequest = remainingRequestSegments.join(emptyString),
                catchAllSubsegment = contentPathSegment.value[0],
                catchAllValue;

            if (remainingRequest.length > 0) {
                catchAllValue = remainingRequest;
            } else {
                catchAllValue = defaultValues[catchAllSubsegment.value];
            }
            matchedValues[catchAllSubsegment.value] = catchAllValue;
        },
        matchContentSegment = function (routeSegment, requestPathSegment, defaultValues, matchedValues) {
            if (!requestPathSegment) {
                // If there's no data to parse, we must have exactly one parameter segment and no other segments - otherwise no match

                if (routeSegment.value.length > 1) {
                    return false;
                }

                var parameterSubsegment2 = routeSegment.value[0];
                if (parameterSubsegment2.type !== parameterType) {
                    return false;
                }

                // We must have a default value since there's no value in the request URL
                if (nativeHasOwn.call(defaultValues, parameterSubsegment2.value)) {
                    var parameterValue = defaultValues[parameterSubsegment2.value];
                    // If there's a default value for this parameter, use that default value
                    matchedValues[parameterSubsegment2.value] = parameterValue;
                    return true;
                } else {
                    // If there's no default value, this segment doesn't match
                    return false;
                }
            }

            // Find last literal segment and get its last index in the string

            var lastIndex = requestPathSegment.length;
            var indexOfLastSegmentUsed = routeSegment.value.length - 1;

            var parameterNeedsValue = null; // Keeps track of a parameter segment that is pending a value
            var lastLiteral = null; // Keeps track of the left-most literal we've encountered

            while (indexOfLastSegmentUsed >= 0) {
                var newLastIndex = lastIndex;

                var parameterSubsegment = null;
                var literalSubsegment;
                if (routeSegment.value[indexOfLastSegmentUsed] && routeSegment.value[indexOfLastSegmentUsed].type === parameterType) {
                    // Hold on to the parameter so that we can fill it in when we locate the next literal
                    parameterSubsegment = routeSegment.value[indexOfLastSegmentUsed];
                    parameterNeedsValue = parameterSubsegment;
                } else {
                    if (routeSegment.value[indexOfLastSegmentUsed] && routeSegment.value[indexOfLastSegmentUsed].type === literalType) {
                        literalSubsegment = routeSegment.value[indexOfLastSegmentUsed];
                        lastLiteral = literalSubsegment;

                        var startIndex = lastIndex - 1;
                        // If we have a pending parameter subsegment, we must leave at least one character for that
                        if (parameterNeedsValue !== null) {
                            startIndex--;
                        }

                        if (startIndex < 0) {
                            return false;
                        }

                        var indexOfLiteral = requestPathSegment.lastIndexOf(literalSubsegment.value, startIndex);
                        if (indexOfLiteral === -1) {
                            // If we couldn't find this literal index, this segment cannot match
                            return false;
                        }

                        // If the first subsegment is a literal, it must match at the right-most extent of the request URL.
                        // Without this check if your route had "/Foo/" we'd match the request URL "/somethingFoo/".
                        // This check is related to the check we do at the very end of this function.
                        if (indexOfLastSegmentUsed === (routeSegment.value.length - 1)) {
                            if ((indexOfLiteral + literalSubsegment.value.length) !== requestPathSegment.length) {
                                return false;
                            }
                        }

                        newLastIndex = indexOfLiteral;
                    } else {
                        return false;
                    }
                }

                if (parameterNeedsValue !== null && ((lastLiteral !== null && parameterSubsegment === null) || indexOfLastSegmentUsed === 0)) {
                    // If we have a pending parameter that needs a value, grab that value
                    var parameterStartIndex;
                    var parameterTextLength;

                    if (lastLiteral === null) {
                        if (indexOfLastSegmentUsed === 0) {
                            parameterStartIndex = 0;
                        } else {
                            parameterStartIndex = newLastIndex + lastLiteral.value.length; // BUG
                        }
                        parameterTextLength = lastIndex;
                    } else {
                        // If we're getting a value for a parameter that is somewhere in the middle of the segment
                        if ((indexOfLastSegmentUsed === 0) && (parameterSubsegment !== null)) {
                            parameterStartIndex = 0;
                            parameterTextLength = lastIndex;
                        } else {
                            parameterStartIndex = newLastIndex + lastLiteral.value.length;
                            parameterTextLength = lastIndex - parameterStartIndex;
                        }
                    }

                    var parameterValueString = requestPathSegment.substr(parameterStartIndex, parameterTextLength);

                    if (!parameterValueString) {
                        // If we're here that means we have a segment that contains multiple sub-segments.
                        // For these segments all parameters must have non-empty values. If the parameter
                        // has an empty value it's not a match.
                        return false;
                    } else {
                        // If there's a value in the segment for this parameter, use the subsegment value
                        matchedValues[parameterNeedsValue.value] = parameterValueString;
                    }

                    parameterNeedsValue = null;
                    lastLiteral = null;
                }

                lastIndex = newLastIndex;
                indexOfLastSegmentUsed--;
            }

            // If the last subsegment is a parameter, it's OK that we didn't parse all the way to the left extent of
            // the string since the parameter will have consumed all the remaining text anyway. If the last subsegment
            // is a literal then we *must* have consumed the entire text in that literal. Otherwise we end up matching
            // the route "Foo" to the request URL "somethingFoo". Thus we have to check that we parsed the *entire*
            // request URL in order for it to be a match.
            // This check is related to the check we do earlier in this function for LiteralSubsegments.
            return (lastIndex === 0) || (routeSegment.value[0] && routeSegment.value[0].type === "parameter");
        },
        matchSegments = function (pathSegments, virtualPath, defaultValues) {
            var requestPathSegments = getUrlParts(virtualPath);

            if (!defaultValues) {
                defaultValues = {};
            }

            var matchedValues = {};

            // This flag gets set once all the data in the URL has been parsed through, but
            // the route we're trying to match against still has more parts. At this point
            // we'll only continue matching separator characters and parameters that have
            // default values.
            var ranOutOfStuffToParse = false;

            // This value gets set once we start processing a catchall parameter (if there is one
            // at all). Once we set this value we consume all remaining parts of the URL into its
            // parameter value.
            var usedCatchAllParameter = false;

            for (var i = 0; i < pathSegments.length; i++) {
                var pathSegment = pathSegments[i];

                if (requestPathSegments.length <= i) {
                    ranOutOfStuffToParse = true;
                }

                var requestPathSegment = ranOutOfStuffToParse ? null : requestPathSegments[i];

                if (pathSegment && pathSegment.type === separatorType) {
                    // If we're trying to match a separator in the route but there's no more content, that's OK
                    if (!ranOutOfStuffToParse) {
                        if (requestPathSegment !== separator) {
                            return null;
                        }
                    }
                } else {
                    var contentPathSegment = pathSegment;
                    if (contentPathSegment && contentPathSegment.type === contentType) {
                        if (isSegmentCatchAll(contentPathSegment)) {
                            matchCatchAllSegment(contentPathSegment, requestPathSegments.slice(i), defaultValues, matchedValues);
                            usedCatchAllParameter = true;
                        } else {
                            if (!matchContentSegment(contentPathSegment, requestPathSegment, defaultValues, matchedValues)) {
                                return null;
                            }
                        }
                    } else {
                        return null;
                    }
                }
            }

            if (!usedCatchAllParameter) {
                if (pathSegments.length < requestPathSegments.length) {
                    // If we've already gone through all the parts defined in the route but the URL
                    // still contains more content, check that the remaining content is all separators.
                    for (var j = pathSegments.length; j < requestPathSegments.length; j++) {
                        if (requestPathSegments[j] !== separator) {
                            return null;
                        }
                    }
                }
            }

            // Copy all remaining default values to the route data
            if (defaultValues !== null) {
                forEachKey(defaultValues, function (defaultKey, defaultValue) {
                    if (!nativeHasOwn.call(matchedValues, defaultKey)) {
                        matchedValues[defaultKey] = defaultValue;
                    }
                });
            }

            return matchedValues;
        },
        forEachParameterSubsegment = function (pathSegments, callback) {
            for (var i = 0; i < pathSegments.length; i++) {
                var pathSegment = pathSegments[i];

                if (pathSegment.type === separatorType) {
                    // We only care about parameter subsegments, so skip this
                    continue;
                } else {
                    var contentPathSegment;
                    if (pathSegment.type === contentType) {
                        contentPathSegment = pathSegment;
                        for (var j = 0; j < contentPathSegment.value.length; ++j) {
                            var subsegment = contentPathSegment.value[j];
                            if (subsegment.type === literalType) {
                                // We only care about parameter subsegments, so skip this
                                continue;
                            } else {
                                var parameterSubsegment = subsegment;
                                if (parameterSubsegment !== null) {
                                    if (!callback(parameterSubsegment)) {
                                        return false;
                                    }
                                } else {
                                    return false;
                                }
                            }
                        }
                    } else {
                        return false;
                    }
                }
            }

            return true;
        },
        getParameterSubsegment = function (pathSegments, parameterName) {
            var foundParameterSubsegment = null;

            forEachParameterSubsegment(pathSegments, function (parameterSubsegment) {
                if (parameterName === parameterSubsegment.value) {
                    foundParameterSubsegment = parameterSubsegment;
                    return false;
                } else {
                    return true;
                }
            });

            return foundParameterSubsegment;
        },
        isParameterRequired = function (parameterSubsegment, defaultValues) {
            if (parameterSubsegment.isCatchAll) {
                return {
                    isRequired: false,
                    defaultValue: undefined
                };
            }
            return {
                isRequired: !nativeHasOwn.call(defaultValues, parameterSubsegment.value),
                defaultValue: defaultValues[parameterSubsegment.value]
            };
        },
        isRoutePartNonEmpty = function (routePart) {
            if (isString(routePart)) {
                return routePart.length > 0;
            }
            return !!routePart;
        },
        areRoutePartsEqual = function (a, b) {
            if (isString(a) && isString(b)) {
                // For strings do a case-insensitive comparison
                return a === b;
            }
            if (a !== null && a !== undefined && b !== null && b !== undefined) {
                // Explicitly compare string form.
                return a.toString() === b.toString();
            }
            // At least one of them is null or undefined. Return true if they both are
            return a === b;
        },
        encodeUrl = browser ? function (url) {
            return url; // For browser hash, no need to encode.
        } : encodeURIComponent, // Encode for server side.
        escapeUrlDataString = browser ? function (value) {
            return value; // For browser hash, no need to escape.
        } : node("querystring").escape, // Escape for server side.
        bind = function (pathSegments, currentValues, values, defaultValues, constraints) {
            currentValues = currentValues || {};
            values = values || {};
            defaultValues = defaultValues || {};

            // The set of values we should be using when generating the URL in this route
            var acceptedValues = {};

            // Keep track of which new values have been used
            var unusedNewValues = {};
            forEachKey(values, function (key) {
                unusedNewValues[key] = null;
            });

            // Step 1: Get the list of values we're going to try to use to match and generate this URL

            // Find out which entries in the URL are valid for the URL we want to generate.
            // If the URL had ordered parameters a="1", b="2", c="3" and the new values
            // specified that b="9", then we need to invalidate everything after it. The new
            // values should then be a="1", b="9", c=<no value>.
            forEachParameterSubsegment(pathSegments, function (parameterSubsegment) {
                // If it's a parameter subsegment, examine the current value to see if it matches the new value
                var parameterName = parameterSubsegment.value;

                var newParameterValue = values[parameterName];
                var hasNewParameterValue = nativeHasOwn.call(values, parameterName);
                if (hasNewParameterValue) {
                    delete unusedNewValues[parameterName];
                }

                var currentParameterValue = currentValues[parameterName];
                var hasCurrentParameterValue = nativeHasOwn.call(currentValues, parameterName);

                if (hasNewParameterValue && hasCurrentParameterValue) {
                    if (!areRoutePartsEqual(currentParameterValue, newParameterValue)) {
                        // Stop copying current values when we find one that doesn't match
                        return false;
                    }
                }

                // If the parameter is a match, add it to the list of values we will use for URL generation
                if (hasNewParameterValue) {
                    if (isRoutePartNonEmpty(newParameterValue)) {
                        acceptedValues[parameterName] = newParameterValue;
                    }
                } else {
                    if (hasCurrentParameterValue) {
                        acceptedValues[parameterName] = currentParameterValue;
                    }
                }
                return true;
            });

            // Add all remaining new values to the list of values we will use for URL generation
            forEachKey(values, function (newKey, newValue) {
                if (isRoutePartNonEmpty(newValue)) {
                    if (!nativeHasOwn.call(acceptedValues, newKey)) {
                        acceptedValues[newKey] = newValue;
                    }
                }
            });

            // Add all current values that aren't in the URL at all
            forEachKey(currentValues, function (currentKey, currentValue) {
                var parameterName2 = currentKey;
                if (!nativeHasOwn.call(acceptedValues, parameterName2)) {
                    var parameterSubsegment2 = getParameterSubsegment(pathSegments, parameterName2);
                    if (parameterSubsegment2 === null) {
                        acceptedValues[parameterName2] = currentValue.Value;
                    }
                }
            });

            // Add all remaining default values from the route to the list of values we will use for URL generation
            forEachParameterSubsegment(pathSegments, function (parameterSubsegment) {
                if (!nativeHasOwn.call(acceptedValues, parameterSubsegment.value)) {
                    var result = isParameterRequired(parameterSubsegment, defaultValues);
                    if (!result.isRequired) {
                        // Add the default value only if there isn't already a new value for it and
                        // only if it actually has a default value, which we determine based on whether
                        // the parameter value is required.
                        acceptedValues[parameterSubsegment.value] = result.defaultValue;
                    }
                }
                return true;
            });

            // All required parameters in this URL must have values from somewhere (i.e. the accepted values)
            var hasAllRequiredValues = forEachParameterSubsegment(pathSegments, function (parameterSubsegment) {
                var result = isParameterRequired(parameterSubsegment, defaultValues);
                if (result.isRequired) {
                    if (!nativeHasOwn.call(acceptedValues, parameterSubsegment.value)) {
                        // If the route parameter value is required that means there's
                        // no default value, so if there wasn't a new value for it
                        // either, this route won't match.
                        return false;
                    }
                }
                return true;
            });

            if (!hasAllRequiredValues) {
                return null;
            }

            // All other default values must match if they are explicitly defined in the new values
            var otherDefaultValues = getRouteValues(defaultValues);
            forEachParameterSubsegment(pathSegments, function (parameterSubsegment) {
                delete otherDefaultValues[parameterSubsegment.value];
                return true;
            });

            var shouldReturnNull = false;
            forEachKey(otherDefaultValues, function (defaultKey, defaultValue) {
                if (nativeHasOwn.call(values, defaultKey)) {
                    delete unusedNewValues[defaultKey];
                    if (!areRoutePartsEqual(values[defaultKey], defaultValue)) {
                        // If there is a non-parameterized value in the route and there is a
                        // new value for it and it doesn't match, this route won't match.
                        shouldReturnNull = true;
                        return false;
                    }
                }
                return true;
            });
            if (shouldReturnNull) {
                return null;
            }

            // Step 2: If the route is a match generate the appropriate URL

            var url = emptyString;
            var pendingParts = emptyString;

            var pendingPartsAreAllSafe = false;

            for (var i = 0; i < pathSegments.length; i++) {
                var pathSegment = pathSegments[i]; // parsedRouteUrlPart

                if (pathSegment.type === separatorType) {
                    if (pendingPartsAreAllSafe) {
                        // Accept
                        if (pendingParts.length > 0) {
                            // Append any pending literals to the URL
                            url += pendingParts;
                            pendingParts = emptyString;
                        }
                    }
                    pendingPartsAreAllSafe = false;

                    if (pendingParts.length > 0 && pendingParts[pendingParts.length - 1] === separator) {
                        // Dev10 676725: Route should not be matched if that causes mismatched tokens
                        return null;
                    }
                    pendingParts += separator;
                } else {
                    var contentPathSegment;
                    if (pathSegment.type === contentType) {
                        contentPathSegment = pathSegment;
                        // Segments are treated as all-or-none. We should never output a partial segment.
                        // If we add any subsegment of this segment to the generated URL, we have to add
                        // the complete match. For example, if the subsegment is "{p1}-{p2}.xml" and we
                        // used a value for {p1}, we have to output the entire segment up to the next "/".
                        // Otherwise we could end up with the partial segment "v1" instead of the entire
                        // segment "v1-v2.xml".
                        var addedAnySubsegments = false;

                        for (var j = 0; j < contentPathSegment.value.length; ++j) {
                            var subsegment = contentPathSegment.value[j];
                            var literalSubsegment;
                            if (subsegment.type === literalType) {
                                literalSubsegment = subsegment;
                                // If it's a literal we hold on to it until we are sure we need to add it
                                pendingPartsAreAllSafe = true;
                                pendingParts += encodeUrl(literalSubsegment.value);
                            } else {
                                var parameterSubsegment3;
                                if (subsegment.type === parameterType) {
                                    parameterSubsegment3 = subsegment;
                                    if (pendingPartsAreAllSafe) {
                                        // Accept
                                        if (pendingParts.length > 0) {
                                            // Append any pending literals to the URL
                                            url += pendingParts;
                                            pendingParts = emptyString;

                                            addedAnySubsegments = true;
                                        }
                                    }
                                    pendingPartsAreAllSafe = false;

                                    // If it's a parameter, get its value
                                    var acceptedParameterValue = acceptedValues[parameterSubsegment3.value];
                                    var hasAcceptedParameterValue = nativeHasOwn.call(acceptedValues, parameterSubsegment3.value);
                                    if (hasAcceptedParameterValue) {
                                        delete unusedNewValues[parameterSubsegment3.value];
                                    }

                                    var defaultParameterValue = defaultValues[parameterSubsegment3.value];

                                    if (areRoutePartsEqual(acceptedParameterValue, defaultParameterValue)) {
                                        // If the accepted value is the same as the default value, mark it as pending since
                                        // we won't necessarily add it to the URL we generate.
                                        pendingParts += encodeUrl(acceptedParameterValue ? acceptedParameterValue.toString() : emptyString);
                                    } else {
                                        // Add the new part to the URL as well as any pending parts
                                        if (pendingParts.length > 0) {
                                            // Append any pending literals to the URL
                                            url += pendingParts;
                                            pendingParts = emptyString;
                                        }
                                        url += encodeUrl(acceptedParameterValue ? acceptedParameterValue.toString() : emptyString);

                                        addedAnySubsegments = true;
                                    }
                                } else {
                                    return null;
                                }
                            }
                        }

                        if (addedAnySubsegments) {
                            // See comment above about why we add the pending parts
                            if (pendingParts.length > 0) {
                                // Append any pending literals to the URL
                                url += pendingParts;
                                pendingParts = emptyString;
                            }
                        }
                    } else {
                        return null;
                    }
                }
            }

            if (pendingPartsAreAllSafe) {
                // Accept
                if (pendingParts.length > 0) {
                    // Append any pending literals to the URL
                    url += pendingParts;
                }
            }

            // Process constraints keys
            if (constraints) {
                // If there are any constraints, mark all the keys as being used so that we don't
                // generate query string items for custom constraints that don't appear as parameters
                // in the URL format.
                forEachKey(constraints, function (constraintKey) {
                    delete unusedNewValues[constraintKey];
                });
            }

            // Add remaining new values as query string parameters to the URL
            if (unusedNewValues) {
                // Generate the query string
                var firstParam = true;
                forEachKey(unusedNewValues, function (unusedNewValue) {
                    if (nativeHasOwn.call(acceptedValues, unusedNewValue)) {
                        url += firstParam ? '?' : '&';
                        firstParam = false;
                        url += escapeUrlDataString(unusedNewValue);
                        url += '=';
                        url += escapeUrlDataString(acceptedValues[unusedNewValue].toString());
                    }
                });
            }

            return {
                url: url,
                values: acceptedValues
            };
        },
        // /Parsed route.

        // RouteData.
        RouteData = function (route, routeHandler, values, dataTokens) {
            this.route = route;
            this.routeHandler = routeHandler;
            this.values = values;
            this.dataTokens = dataTokens;
        },
        // /RouteData.

        // VirtualPathData.
        VirtualPathData = function (route, virtualPath, dataTokens /* optional */) {
            this.route = route;
            this.virtualPath = virtualPath;
            this.dataTokens = dataTokens;
        },
        // /VirtualPathData.

        // Route.
        processConstraint = function (route, constraint, virtualPath, parameterName, values, isIncomingRequest) {
            var parameterValue = values[parameterName];
            if (isFunction(constraint)) {
                return constraint(parameterValue, virtualPath, route, parameterName, values, isIncomingRequest);
            }

            // If there was no custom constraint, then treat the constraint as a string which represents a Regex.
            if (!isString(constraint)) {
                error("'constraint' must be function or string");
            }

            var parameterValueString = parameterValue.toString();
            var constraintsRegEx = new RegExp("^(" + constraint + ")$", "i");
            return parameterValueString.match(constraintsRegEx);
        },
        processConstraints = function (route, constraints, virtualPath, values, isIncomingRequest) {
            var result = true;
            forEachKey(constraints, function (key, value) {
                if (!processConstraint(route, value, virtualPath, key, values, isIncomingRequest)) {
                    result = false;
                    return false; // break;
                }
                return true;
            });
            return result;
        },
        Route = (function () {
            var constructor = function (url, defaults /* optional */, constraints, dataTokens, routeHandler, name) {
                if (!isString(url)) {
                    error("'url' must be valid.");
                }
                url = url.toLowerCase();
                this._segments = getParsedSegments(url);
                if (this._segments === null) {
                    error("'url' must be valid.");
                }
                if (!routeHandler) {
                    routeHandler = noop;
                } else if (!isFunction(routeHandler)) {
                    error("'routeHandler' must be valid.");
                }
                if (name && !isString(name)) {
                    error("'name' must be string or empty.");
                }

                this.url = url;
                this.routeHandler = routeHandler;
                this.defaults = getRouteValues(defaults);
                this.constraints = getRouteValues(constraints);
                this.dataTokens = getRouteValues(dataTokens);
                this.name = name;
            };

            constructor.prototype = {
                constructor: constructor,

                getVirtualPathData: function (routeValues, currentRouteValues /* optional */) {
                    routeValues = getRouteValues(routeValues);
                    currentRouteValues = getRouteValues(currentRouteValues);
                    var result = bind(this._segments, currentRouteValues, routeValues, this.defaults, this.constraints);

                    if (result === null) {
                        return null;
                    }

                    // Verify that the route matches the validation rules
                    if (!processConstraints(this, this.constraints, result.url, result.values, false)) {
                        return null;
                    }

                    var virtualPathData = new VirtualPathData(this, result.url, getRouteValues(this.dataTokens));
                    return virtualPathData;
                },

                getRouteData: function (virtualPath) {
                    if (!isString(virtualPath)) {
                        error("'virtualPath' must be string.");
                    }
                    virtualPath = virtualPath.toLowerCase();
                    var values = matchSegments(this._segments, virtualPath, this.defaults);
                    if (values === null) {
                        // If we got back a null value set, that means the URL did not match
                        return null;
                    }

                    // Validate the values
                    if (!processConstraints(this, this.constraints, virtualPath, values, true)) {
                        return null;
                    }

                    // Copy the matched values
                    // Copy the DataTokens from the Route to the RouteData
                    var routeData = new RouteData(this, this.routeHandler, getRouteValues(values), getRouteValues(this.dataTokens));

                    return routeData;
                }
            };

            return constructor;
        }()),
        // /Route.

        // RouteCollection.
        IgnoreRoute = (function () {
            var constructor = function (url, constraints  /* optional */) {
                Route.call(this, url, {}, constraints, {}, noop);
            };

            constructor.prototype = {
                constructor: constructor,
                // routeData.routeHandler is always noop.
                getVirtualPathData: function () {
                    return null;
                },

                getRouteData: Route.prototype.getRouteData
            };

            return constructor;
        }()),
        RouteTable = function () {
            var namedRoutes = {},
                allRoutes = [];

            this.getRouteData = function (virtualPath) {
                if (!isString(virtualPath)) {
                    error("'virtualPath' must be string.");
                }
                virtualPath = virtualPath.toLowerCase();
                // Go through all the configured routes and find the first one that returns a match
                for (var index = 0; index < allRoutes.length; ++index) {
                    var routeData = allRoutes[index].getRouteData(virtualPath);
                    if (routeData) {
                        return routeData;
                    }
                }
                return null;
            };

            this.getVirtualPathData = function (routeValues, currentRouteValues, filter /* optional */) {
                if (filter && !isFunction(filter)) {
                    error("'filter' must be function.");
                }

                // Go through all the configured routes and find the first one that returns a match
                for (var index = 0; index < allRoutes.length; ++index) {
                    var route = allRoutes[index];
                    if (!filter || filter(route)) {
                        var virtualPathData = route.getVirtualPathData(routeValues, currentRouteValues);
                        if (virtualPathData) {
                            return virtualPathData;
                        }
                    }
                }
                return null;
            };

            this.push = function (route) {
                if (!(route.constructor === Route || route.constructor === IgnoreRoute)) {
                    error("'route' must be valid.");
                }
                if (route.name) {
                    var lowerCaseKey = route.name.toLowerCase();
                    if (nativeHasOwn.call(namedRoutes, lowerCaseKey)) {
                        error("'name' must be unique.");
                    }
                    namedRoutes[lowerCaseKey] = route;
                }
                allRoutes.push(route);
                return route;
            };

            this.get = function (key) {
                // Key should be either name or index.
                if (isString(key)) {
                    var lowerCaseKey = key.toLowerCase();
                    return namedRoutes[lowerCaseKey];
                }
                return allRoutes[key];
            };

            this.ignore = function (url, constraints /* optional */) {
                return this.push(new IgnoreRoute(url, constraints));
            };

            this.clear = function () {
                namedRoutes = {};
                allRoutes = [];
            };

            this.length = function () {
                return allRoutes.length;
            };

            this.Route = function (url, defaults /* optional */, constraints, dataTokens, routeHandler, name) {
                return new Route(url, defaults /* optional */, constraints, dataTokens, routeHandler, name);
            };
        };
    // /RouteCollection.

    // Exports.
    jsMVC.routeTable = new RouteTable();

    _.getUrlParts = getUrlParts;
    _.getSegmentLiteral = getSegmentLiteral;
    _.getIndexOfFirstOpenParameter = getIndexOfFirstOpenParameter;
    _.getUrlSubsegments = getUrlSubsegments;
    _.isUrlSubsegmentsValid = isUrlSubsegmentsValid;
    _.isUrlPartsValid = isUrlPartsValid;
    _.matchSegments = matchSegments;
    _.getParsedSegments = getParsedSegments;
    _.forEachParameterSubsegment = forEachParameterSubsegment;
    _.encodeUrl = encodeUrl;
    _.escapeUrlDataString = escapeUrlDataString;

}(this.window, !this.window && require, this.jsMVC || exports));

﻿/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.routing.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    if (!browser) {
        // Not in browser.
        return;
    }

    // Imports.
    var location = browser.location,
        history = browser.history,
        document = browser.document,
        documentMode = document.documentMode,
        _ = jsMVC._,
        error = _.error,
        type = _.type,
        trigger = _.trigger,
        Event = _.Event,
        copyProps = _.copyProperties,
        isFunction = _.isFunction,
        routeTable = jsMVC.routeTable,
        // Local variables.
        iframeHTML = '<iframe tabindex="-1" style="display: none; visibility: hidden;" src="javascript:0"></iframe>',
        hashDelimiter = "#",
        prefix = "!", // Hashbang for SEO. See https://developers.google.com/webmasters/ajax-crawling/docs/getting-started
        prefixLength = prefix.length,
        hashChangeEvent = "hashchange",
        onHashChangeEvent = "on" + hashChangeEvent,
        queryStringFlag = "?",
        previousHref = location.href,
        currentHref,
        // Browser.
        getHash = function (href) {
            // location.hash has issues in IE6.
            return href.replace(/^[^#]*#?(.*)$/, "$1"); // TODO: refactor.
        },
        setHash = function (hash) {
            if (hash.indexOf(hashDelimiter) === 0) {
                hash = hash.substr(1);
            }
            if (hash.indexOf(prefix) === 0) {
                hash = hash.substr(prefixLength);
            }
            hash = prefix + hash;
            location.hash = hash;
        },
        normalizeEvent = function (options) {
            var event = new Event(),
                virtualPath,
                index,
                newHash;
            options = options || {};
            currentHref = location.href;
            virtualPath = newHash = options.newHash || getHash(currentHref);
            if (virtualPath.substr(0, prefixLength) === prefix) {
                virtualPath = virtualPath.substr(prefixLength); // Remove starting "/".
            }
            index = virtualPath.indexOf(queryStringFlag);
            if (index >= 0) {
                virtualPath = virtualPath.slice(0, index); // Remove query string.
            }
            copyProps(event, {
                type: options.type || hashChangeEvent,
                timeStamp: options.timeStamp || event.timeStamp,
                target: options.target,
                currentTarget: options.currentTarget,
                virtualPath: virtualPath,
                routeData: routeTable.getRouteData(virtualPath),

                newHref: options.newURL || currentHref,
                oldHref: options.oldURL || previousHref,
                newHash: newHash,
                oldHash: options.oldHash || getHash(previousHref),

                request: undefined,
                response: undefined
            }, true);
            previousHref = currentHref;
            return event;
        },
        listen = function (callback) {
            var onReadyStateChangeEvent = "onreadystatechange",
                onLoadEvent = "onload",
                proxyToIframe,
                domReady,
                eventListener = function (event) {
                    trigger("request", normalizeEvent(event || browser.event));
                },
                iframeWindow;
            if (onHashChangeEvent in browser && browser.addEventListener) {
                // IE9, Safari, Chrome, Firefox, Opera.
                // IE treats all hashes as case insensitive, while the other browsers treat them case sensitive
                browser.addEventListener(hashChangeEvent, eventListener, false);
            } else if (browser.attachEvent) {
                if (onHashChangeEvent in browser && documentMode && documentMode > 7) {
                    // IE8
                    browser.attachEvent(onHashChangeEvent, eventListener);
                } else if (onReadyStateChangeEvent in document) {
                    // IE7, IE6.
                    proxyToIframe = function () {
                        var iframe = document.createElement(iframeHTML),
                            currentIframeHref,
                            previousIframeHref,
                            body,
                            poll = function () {
                                iframe.detachEvent(onLoadEvent, poll);
                                browser.setInterval(function () {
                                    currentHref = location.href;
                                    if (previousHref !== currentHref) {
                                        // window.location changed, now window drives iframeWindow.
                                        //oldHrefCopy = oldHref;
                                        //oldHref = newHref;
                                        iframeWindow.document.title = document.title;
                                        iframeWindow.document.open();
                                        iframeWindow.document.close();
                                        iframeWindow.location.hash = getHash(currentHref);
                                        // Avoid trigger iframe's hash change event.
                                        previousIframeHref = iframeWindow.location.href;
                                        trigger("request", normalizeEvent({
                                            // https://developer.mozilla.org/en-US/docs/DOM/event.currentTarget
                                            target: browser, // The element on which the event occurred.
                                            currentTarget: iframeWindow // The element the event handler has been attached to.
                                            //newURL: newHref,
                                            //oldURL: oldHrefCopy,
                                            //newHash: getHash(newHref),
                                            //oldHash: getHash(oldHrefCopy)
                                        }));
                                    } else {
                                        currentIframeHref = iframeWindow.location.href;
                                        if (previousIframeHref !== currentIframeHref) {
                                            // iframe.contentWindow.location changed, now iframeWindow drives window.
                                            previousIframeHref = currentIframeHref;
                                            location.hash = getHash(currentIframeHref);
                                            // Avoid trigger window's hash change event.
                                            currentHref = location.href;
                                            //oldHrefCopy = oldHref;
                                            //oldHref = newHref;
                                            trigger("request", normalizeEvent({
                                                // https://developer.mozilla.org/en-US/docs/DOM/event.currentTarget
                                                target: iframeWindow, // The element on which the event occurred.
                                                currentTarget: iframeWindow // The element the event handler has been attached to.
                                                //newURL: newHref,
                                                //oldURL: oldHrefCopy,
                                                //newHash: getHash(newHref),
                                                //oldHash: getHash(oldHrefCopy)
                                            }));
                                        }
                                    }
                                }, 100);
                            };
                        iframe.attachEvent("onload", poll);
                        body = browser.document.body;
                        body.parentNode.insertBefore(iframe, body.nextSibling);
                        iframeWindow = iframe.contentWindow;
                        previousIframeHref = iframeWindow.location.href;
                    };
                    domReady = function () {
                        if (document.readyState === "complete") {
                            document.detachEvent(onReadyStateChangeEvent, domReady);
                            proxyToIframe();
                        }
                    };
                    if (document.readyState === "complete") {
                        proxyToIframe();
                    } else {
                        document.attachEvent(onReadyStateChangeEvent, domReady);
                    }
                }
            } else {
                // Other old browser.
                error("Please upgrade browser to latest version.");
            }
            if (isFunction(callback)) {
                callback(iframeWindow || browser);
            }
        },
    // /Browser

    // Routing
        go = function (destination, options) {
            var oldHref = location.href,
                virtualPathData,
                oldRouteData;
            options = options || {};
            switch (type(destination)) {
                case "number":
                    history.go(destination); // IE6 / IE7 / Chrome / Safari / Opera does not support programatically go back / forward.
                    return location.href !== oldHref;
                case "string":
                    setHash(destination);
                    return location.href !== oldHref;
                case "object":
                    oldRouteData = normalizeEvent().routeData;
                    virtualPathData = routeTable.getVirtualPathData(destination, oldRouteData ? oldRouteData.values : {}, options.filter);
                    if (virtualPathData) {
                        setHash(virtualPathData.virtualPath); // trigger("request", normalizeEvent(event || browser.event));
                        return location.href !== oldHref;
                    }
                    return false;
                default:
                    return false;
            }
        };
    // /Routing

    jsMVC.go = go; // TODO: Consider removing this.
    jsMVC.current = normalizeEvent;

    _.listen = listen;

}(this.window, !this.window && require, this.jsMVC || exports));

﻿/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.routing.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    if (browser) {
        // Not in node.js.
        return;
    }

    // Imports.
    var _ = jsMVC._,
        trigger = _.trigger,
        copyProps = _.copyProperties,
        Event = _.Event,
        type = _.type,
        isFunction = _.isFunction,
        routeTable = jsMVC.routeTable,
        status = jsMVC.status,
        // Local variables.
        http = node("http"),
        url = node("url"),
        domain = node("domain"),
        prefix = "/",
        prefixLength = prefix.length,
        server,
        normalizeEvent = function (options) {
            var event = new Event(),
                request,
                requestMethod,
                virtualPath,
                requestedUrl,
                referrerUrl,
                address;
            options = options || {};
            request = options.request;

            if (request) { // Get info from request.
                requestMethod = request.method;

                requestedUrl = url.parse(request.url);
                requestedUrl.protocol = request.connection.encrypted ? "https" : "http";
                requestedUrl.host = request.headers.host;

                referrerUrl = request.headers.referer || request.headers.Referer;
            } else { // Get info from options.
                // If options.url is provided, use options.url and ignore options.virtualPath.
                requestMethod = options.type;
                requestedUrl = options.newHref || options.virtualPath;
                requestedUrl = url.parse(requestedUrl);
                if (server) {
                    address = server.address();
                    if (address) {
                        requestedUrl.hostname = address.address === "0.0.0.0" ? "localhost" : address.address;
                        requestedUrl.port = address.port;
                    }
                }

                referrerUrl = options.oldHref;
            }

            referrerUrl = referrerUrl !== undefined ? url.parse(referrerUrl) : {};

            virtualPath = requestedUrl.pathname;
            if (virtualPath && virtualPath.substr(0, prefixLength) === prefix) {
                virtualPath = virtualPath.substr(prefixLength); // Remove starting "/".
            }

            return copyProps(event, {
                type: requestMethod,
                // timeStamp is already in event.
                target: options.server || null,
                currentTarget: options.server || null,
                virtualPath: virtualPath,
                routeData: virtualPath ? routeTable.getRouteData(virtualPath) : null,

                newHref: url.format(requestedUrl),
                oldHref: referrerUrl.href,
                newHash: requestedUrl.hash,
                oldHash: referrerUrl.hash,

                request: request,
                response: options.response
            });
        },
        listen = function (callback) {
            var serverDomain = domain.create();
            serverDomain.run(function () {
                server = http.createServer().on("request", function (request, response) {
                    var requestDomian = domain.create(),
                        event = normalizeEvent({
                            request: request,
                            response: response,
                            domain: requestDomian,
                            server: this // server.
                        });
                    requestDomian.add(request);
                    requestDomian.add(response);
                    requestDomian.on("error", function (error) {
                        try {
                            event.status = status.internalError;
                            event.error = error;
                            trigger("fail", event);
                            response.on("close", function () {
                                requestDomian.dispose();
                            });
                        } catch (err) {
                            requestDomian.dispose();
                        }
                    });

                    trigger("request", event);
                });
                if (isFunction(callback)) {
                    callback(server, serverDomain);
                }
            });
        };

    jsMVC.go = function (destination, options) {
        var virtualPathData;
        options = options || {};
        switch (type(destination)) {
            case "string":
                trigger("request", normalizeEvent({
                    newHref: destination
                }));
                return true;
            case "object":
                virtualPathData = routeTable.getVirtualPathData(destination, {}, options.filter);
                if (virtualPathData) {
                    trigger("request", normalizeEvent(copyProps({
                        virtualPath: virtualPathData.virtualPath
                    }, options)));
                    return true;
                }
                return false;
            default:
                return false;
        }
    };

    jsMVC.current = normalizeEvent;
    _.listen = listen;

}(this.window, !this.window && require, this.jsMVC || exports));

﻿/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.routing.js"/>
/// <reference path="jsMVC.routing.browser.js"/>
/// <reference path="jsMVC.routing.node.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    // Imports.
    var nativeHasOwn = Object.prototype.hasOwnProperty,
        routeTable = jsMVC.routeTable,
        Route = routeTable.Route,
        _ = jsMVC._,
        error = _.error,
        isString = _.isString,
        isFunction = _.isFunction,
        isInteger = _.isInteger,
        forEachItem = _.forEachItem,
        forEachKey = _.forEachKey,
        copyProps = _.copyProperties,
        some = _.some,
        reduceRight = _.reduceRight,
        map = _.map,
        Event = _.Event,
        returnFalse = _.returnFalse,
        // Local variables.
        separator = "/",
        emptyString = "",
        status = {
            notFound: 404,
            internalError: 500,
            badRequest: 400,
            ok: 200
        },
        errorFilter = "error",
        beforeActionFilter = "beforeAction",
        afterActionFilter = "afterAction",
        authorizeFilter = "authorize",
        parseIntRadix = 10,
        defaultOrder = 0,
        idKey = "id",
        // Routing
        isValidRouteParameter = function (value, canBeEmpty) {
            return (canBeEmpty && (value === undefined || value === emptyString)) || (isString(value) && value.indexOf(separator) === -1 && value !== emptyString);
        },
        validateRouteParameter = function (value, canBeEmpty) {
            if (!isValidRouteParameter(value, canBeEmpty)) {
                error(canBeEmpty ? "Route value must be valid." : "Route value must be valid and not empty.");
            }
            return value ? value.toLowerCase() : value;
        },
        combinePaths = function (child, parent) {
            return (parent ? parent + separator : emptyString) + validateRouteParameter(child);
        },
        // /Routing

        // Cache
        Dictionary = (function () { // Case-insensitive dictionary
            var constructor = function () {
                this.items = {};
            };

            constructor.prototype = {
                constructor: constructor,

                push: function (key, item) {
                    var lowerCaseKey = key.toLowerCase();
                    if (nativeHasOwn.call(this.items, lowerCaseKey)) {
                        error("Key '" + key + "' must be unique.");
                    }
                    this.items[lowerCaseKey] = item;
                    return item;
                },

                get: function (key) {
                    return this.items[key.toLowerCase()];
                },

                has: function (key, item) {
                    key = key.toLowerCase();
                    if (arguments.length > 1) {
                        return this.items[key] === item;
                    }
                    return nativeHasOwn.call(this.items, key);
                }
            };

            return constructor;
        }()),
        List = (function () {
            var constructor = function (isOrderRequired, array) {
                // TODO: Check array.
                this.isOrderRequired = isOrderRequired;
                this.items = array || [];
                if (isOrderRequired && this.items.length > 1) {
                    this.sort();
                }
            };
            constructor.prototype = {
                constructor: constructor,

                sort: function (compare) {
                    compare = compare || function (a, b) {
                        return a.order - b.order;
                    };
                    this.items.sort(compare);
                },

                push: function (item) {
                    if (this.isOrderRequired && !isInteger(item.order)) {
                        error("'order' must be integer.");
                    }

                    this.items.push(item);
                    if (this.isOrderRequired) {
                        this.sort();
                    }
                    return item;
                },

                get: function (index) {
                    return this.items[index];
                },

                has: function (item) {
                    for (var index = 0; index < this.items.length; index++) {
                        if (item === this.items[index]) {
                            return true;
                        }
                    }
                    return false;
                },

                toArray: function () {
                    return this.items.slice();
                },

                forEach: function (callback, context) {
                    forEachItem(this.items, callback, context);
                },

                map: function (callback, initial) {
                    return new List(this.isOrderRequired, map(this.items, callback, initial));
                },

                reverse: function () {
                    return new List(this.isOrderRequired, this.items.reverse());
                },

                reduceRight: function (callback, initial) {
                    return reduceRight(this.items, callback, initial);
                },

                some: function (callback, context) {
                    return some(this.items, callback, context);
                },

                length: function () {
                    return this.items.length;
                }
            };

            return constructor;
        }()),
        allAreas = new Dictionary(),
        allControllers = new Dictionary(),
        allActions = new Dictionary(),
        globalFilters = new List(true),
        // /Cache

        // Filter

        Filter = function (authorize, beforeAction, afterAction, fail, order) {
            if (authorize && !isFunction(authorize)) {
                error("'authorize' must be empty or function.");
            }
            if (beforeAction && !isFunction(beforeAction)) {
                error("'beforeAction' must be empty or function.");
            }
            if (afterAction && !isFunction(afterAction)) {
                error("'afterAction' must be empty or function.");
            }
            if (fail && !isFunction(fail)) {
                error("'fail' must be empty or function.");
            }
            this[authorizeFilter] = authorize;
            this[beforeActionFilter] = beforeAction;
            this[afterActionFilter] = afterAction;
            this[errorFilter] = fail;
            this.order = parseInt(order, parseIntRadix) || defaultOrder;
            if (!isInteger(this.order)) {
                error("'order' must be integer or undefined.");
            }
        },
        getFilterList = function (optionsArray) {
            var filters = new List(true),
                filter;
            forEachItem(optionsArray, function (options) {
                filter = new Filter(options[authorizeFilter], options[beforeActionFilter], options[afterActionFilter], options[errorFilter], options.order);
                filters.push(filter);
            });
            return filters;
        },
        executeAndSetResult = function (event, execute) {
            var previousResult = event.result,
                result = execute(event);
            if (result !== undefined) {
                event.result = result;
                return true;
            }
            event.result = previousResult; // Prvent execute(event) modifying event.result.
            return false;
        },
        executeFilters = function (event, levels, filterType) {
            var execute;
            if (event.isPropagationStopped()) {
                return; // If isPropagationStopped, do nothing.
            }
            event.isImmediatePropagationStopped = returnFalse;
            forEachItem(levels, function (filters) {
                if (event.isImmediatePropagationStopped()) {
                    return false; // If isImmediatePropagationStopped, return false to break.
                }
                if (filters) {
                    filters.forEach(function (filter) {
                        if (event.isImmediatePropagationStopped()) {
                            return false; // If isImmediatePropagationStopped, return false to break.
                        }
                        execute = filter[filterType];
                        if (execute) {
                            executeAndSetResult(event, execute);
                        }
                        return true;
                    });
                }
                return true;
            });
        },
        executeErrorFilters = function (event, levels) {
            var execute;
            forEachItem(levels, function (filters) {
                if (event.isErrorHandled()) {
                    return false; // If isErrorHandled, return false to break.
                }
                if (filters) {
                    filters.forEach(function (filter) {
                        if (event.isErrorHandled()) {
                            return false; // If isErrorHandled, return false to break.
                        }
                        execute = filter[errorFilter];
                        if (execute) {
                            executeAndSetResult(event, execute);
                        }
                        return true;
                    });
                }
                return true;
            });
        },
        pushFilter = function (options) {
            var filter = new Filter(options[authorizeFilter], options[beforeActionFilter], options[afterActionFilter], options[errorFilter], options.order),
                target = options.target;
            if (!target) {
                globalFilters.push(filter);
            } else {
                if (target.filters) {
                    target.filters.push(filter);
                } else {
                    error("'target' must be valid area, controller, or action.");
                }
            }
        },
        getGlobalFilters = function () {
            return globalFilters.toArray();
        },
        // /Filter

        // Action

        Action = (function () {
            var constructor = function (controller, id, execute, filters) {
                if (!controller || !allControllers.has(controller.virtualPath, controller)) {
                    error("'controller' must be valid.");
                }
                id = validateRouteParameter(id);
                if (!isFunction(execute)) {
                    error("'execute' must be function.");
                }
                this.controller = controller;
                this[idKey] = id;
                this.execute = execute;
                this.filters = filters;
                this.virtualPath = combinePaths(id, controller.virtualPath);
            };

            constructor.prototype = {
                constructor: constructor,
                Filter: function (options) {
                    options.target = this;
                    return pushFilter(options);
                },

                getFilters: function () {
                    return this.filters.toArray();
                }
            };
            return constructor;
        }()),
        pushAction = function (options) {
            var filters = getFilterList(options.filters),
                action;
            if (isFunction(options)) {
                options = {
                    controller: options.controller,
                    execute: options // TODO: Refactor.
                };
                options[idKey] = options.actionId;
            }
            action = new Action(options.controller, options[idKey], options.execute, filters);
            return allActions.push(action.virtualPath, action);
        },
        // /Action

        // Controller

        Controller = (function () {
            var constructor = function (id, area, filters) {
                id = validateRouteParameter(id);
                if (area && !allAreas.has(area.virtualPath, area)) {
                    error("'area' must be valid or empty.");
                }
                this[idKey] = id;
                this.area = area;
                this.virtualPath = combinePaths(id, area ? area.virtualPath : undefined);
                this.filters = filters;
            };

            constructor.prototype = {
                constructor: constructor,
                Action: function (options) {
                    options.controller = this;
                    return pushAction(options);
                },

                Filter: function (options) {
                    options.target = this;
                    return pushFilter(options);
                },

                getAction: function (id) {
                    return allActions.get(combinePaths(id, this.virtualPath));
                },

                getFilters: function () {
                    return this.filters.toArray();
                }
            };
            return constructor;
        }()),
        getActionOptions = function (options, id) {
            if (isFunction(options)) {
                options = {
                    execute: options
                };
            }
            if (!(nativeHasOwn.call(options, idKey))) {
                options[idKey] = id;
            }
            return options;
        },
        pushController = function (options) {
            var filters,
                controller;
            if (!options.area && options.areaId) {
                options.area = allAreas.get(options.areaId);
            }
            filters = getFilterList(options.filters);
            controller = new Controller(options[idKey], options.area, filters);
            allControllers.push(controller.virtualPath, controller);
            forEachKey(options.actions, function (actionId, actionOptions) {
                actionOptions = getActionOptions(actionOptions, actionId);
                controller.Action(actionOptions);
            });
            return controller;
        },
        getController = function (id) {
            return allControllers.get(id);
        },
        // /Controller

        // Area

        Area = (function () {
            var constructor = function (id, filters) {
                this.virtualPath = this[idKey] = validateRouteParameter(id);
                this.filters = filters;
            };

            constructor.prototype = {
                constructor: constructor,
                Route: function (options) {
                    options.areaId = this[idKey];
                    return pushRoute(options);
                },

                Controller: function (options) {
                    options.area = this;
                    return pushController(options);
                },

                Filter: function (options) {
                    options.target = this;
                    return pushFilter(options);
                },

                getController: function (id) {
                    return allControllers.get(combinePaths(id, this.virtualPath));
                },

                getFilters: function () {
                    return this.filters.toArray();
                }
            };
            return constructor;
        }()),
        pushArea = function (options) {
            var filters = getFilterList(options.filters),
                area = new Area(options[idKey], filters);
            allAreas.push(area.virtualPath, area);
            forEachKey(options.controllers, function (controllerId, controllerOptions) {
                if (!nativeHasOwn.call(controllerOptions, idKey)) {
                    controllerOptions[idKey] = controllerId;
                }
                area.Controller(controllerOptions);
            });
            forEachKey(options.routes, function (routeId, routeOptions) {
                if (!nativeHasOwn.call(routeOptions, idKey)) {
                    routeOptions[idKey] = routeId;
                }
                area.Route(routeOptions);
            });
            return area;
        },
        getArea = function (id) {
            return allAreas.get(id);
        },
        // /Area

        // Execute
        executeResult = function (event, result) {
            if (result && isFunction(result.execute)) {
                result.execute(event);
            }
        },
        handleError = function (event, errorObject, errorStatus, filterLevels) {
            event.status = errorStatus;
            event.error = errorObject;
            executeErrorFilters(event, filterLevels);
            if (!event.isErrorHandled()) {
                throw errorObject;
            }
            return executeResult(event, event.result);
        },
        executeAction = function (routeData, virtualPath, actionId, controllerId, areaId /* optional */) {
            var event = routeData.dataTokens.event || new Event(),
                action,
                filterLevels,
                reversedFilterLevels;

            delete routeData.dataTokens.event;

            // 1. Validate segments.
            try {
                event.actionId = validateRouteParameter(actionId);
                event.controllerId = validateRouteParameter(controllerId);
                event.areaId = validateRouteParameter(areaId, true);
            } catch (e) {
                return handleError(event, e, status.badRequest, [globalFilters]);
            }

            // TODO: Find area/controller.
            // 2. Find action.
            action = allActions.get(combinePaths(actionId, combinePaths(controllerId, areaId)));
            if (!action) {
                // Action is not found.
                return handleError(event, new Error("Action cannot be found."), status.notFound, [globalFilters]);
            }

            // Action is found.
            event.actionVirtualPath = action.virtualPath;
            event.action = action;
            event.controller = action.controller;
            event.area = action.controller.area;
            filterLevels = [
                globalFilters,
                event.area ? event.area.filters : null,
                event.controller.filters,
                event.action.filters
            ];
            reversedFilterLevels = [
                event.action.filters.reverse(),
                event.controller.filters.reverse(),
                event.area ? event.area.filters.reverse() : null,
                globalFilters.reverse()
            ];
            try {
                // 3. Execute authorize filters
                executeFilters(event, filterLevels, authorizeFilter);

                // Execute beforeAction filters.
                executeFilters(event, filterLevels, beforeActionFilter);

                // Execute Action.
                if (!event.isDefaultPrevented()) {
                    executeAndSetResult(event, action.execute);
                }

                // Execute afterAction filters.
                executeFilters(event, reversedFilterLevels, afterActionFilter);

                // Execute result.
                return executeResult(event, event.result);
            } catch (e2) {
                return handleError(event, e2, event.status || status.internalError, filterLevels);
            }
        },
        // /Execute

        // MvcRouteHandler
        mvcRouteHandler = function (routeData, virtualPath) {
            executeAction(routeData, virtualPath, routeData.values.action, routeData.values.controller, routeData.dataTokens.area);
        },
        pushRoute = function (options) {
            if (options.areaId) {
                options.dataTokens = options.dataTokens || {};
                options.dataTokens.area = validateRouteParameter(options.areaId);
            }
            var route = new Route(options.url, options.defaults, options.constraints, options.dataTokens, mvcRouteHandler, options[idKey]);

            return routeTable.push(route);
        };
        // /MvcRoutHandler

    // Exports.
    jsMVC.Route = pushRoute; // Different from jsMVC.routeTable.Route.
    jsMVC.Area = pushArea;
    jsMVC.Controller = pushController;
    jsMVC.Filter = pushFilter;
    jsMVC.getArea = getArea;
    jsMVC.getController = getController;
    jsMVC.getFilters = getGlobalFilters;
    jsMVC.status = status;

    _.executeGlobalErrorFilters = function (event) {
        executeErrorFilters(event, [globalFilters]);
    };
    // /Exports.

}(this.window, !this.window && require, this.jsMVC || exports));

﻿/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.routing.js"/>
/// <reference path="jsMVC.routing.browser.js"/>
/// <reference path="jsMVC.routing.node.js"/>
/// <reference path="jsMVC.controller.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    var _ = jsMVC._,
        noop = _.noop,
        EmptyResult = (function () {
            var constructor = function () {
            };

            constructor.prototype = {
                constructor: constructor,
                execute: noop
            };
            return constructor;
        }());

    jsMVC.event.noop = function () {
        return new EmptyResult();
    };

}(this.window, !this.window && require, this.jsMVC || exports));

﻿/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.routing.js"/>
/// <reference path="jsMVC.routing.browser.js"/>
/// <reference path="jsMVC.routing.node.js"/>
/// <reference path="jsMVC.controller.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    if (!browser) {
        return;
    }

}(this.window, !this.window && require, this.jsMVC || exports));

﻿/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.routing.js"/>
/// <reference path="jsMVC.routing.browser.js"/>
/// <reference path="jsMVC.routing.node.js"/>
/// <reference path="jsMVC.controller.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    if (browser) {
        return;
    }

    var isString = jsMVC._.isString,
        fs = node("fs"),
        path = node("path"),
        extensionDelimiter = ".",
        extensionDelimiterLength = extensionDelimiter.length,
        contentTypes = {
            // https://gist.github.com/rrobe53/976610
            //"3gp": "video/3gpp",
            //"a": "application/octet-stream",
            //"ai": "application/postscript",
            //"aif": "audio/x-aiff",
            //"aiff": "audio/x-aiff",
            //"asc": "application/pgp-signature",
            //"asf": "video/x-ms-asf",
            //"asm": "text/x-asm",
            //"asx": "video/x-ms-asf",
            //"atom": "application/atom+xml",
            //"au": "audio/basic",
            //"avi": "video/x-msvideo",
            //"bat": "application/x-msdownload",
            //"bin": "application/octet-stream",
            //"bmp": "image/bmp",
            //"bz2": "application/x-bzip2",
            //"c": "text/x-c",
            //"cab": "application/vnd.ms-cab-compressed",
            //"cc": "text/x-c",
            //"chm": "application/vnd.ms-htmlhelp",
            //"class": "application/octet-stream",
            //"com": "application/x-msdownload",
            //"conf": "text/plain",
            //"cpp": "text/x-c",
            //"crt": "application/x-x509-ca-cert",
            //"csv": "text/csv",
            //"cxx": "text/x-c",
            //"deb": "application/x-debian-package",
            //"der": "application/x-x509-ca-cert",
            //"diff": "text/x-diff",
            //"djv": "image/vnd.djvu",
            //"djvu": "image/vnd.djvu",
            //"dll": "application/x-msdownload",
            //"dmg": "application/octet-stream",
            //"doc": "application/msword",
            //"dot": "application/msword",
            //"dtd": "application/xml-dtd",
            //"dvi": "application/x-dvi",
            //"ear": "application/java-archive",
            //"eml": "message/rfc822",
            //"eps": "application/postscript",
            //"exe": "application/x-msdownload",
            //"f": "text/x-fortran",
            //"f77": "text/x-fortran",
            //"f90": "text/x-fortran",
            //"flv": "video/x-flv",
            //"for": "text/x-fortran",
            //"gem": "application/octet-stream",
            //"gemspec": "text/x-script.ruby",
            //"gif": "image/gif",
            //"gz": "application/x-gzip",
            //"h": "text/x-c",
            //"hh": "text/x-c",
            //"ics": "text/calendar",
            //"ifb": "text/calendar",
            //"iso": "application/octet-stream",
            //"jar": "application/java-archive",
            //"java": "text/x-java-source",
            //"jnlp": "application/x-java-jnlp-file",
            //"jpeg": "image/jpeg",
            //"jpg": "image/jpeg",
            //"json": "application/json",
            //"log": "text/plain",
            //"m3u": "audio/x-mpegurl",
            //"m4v": "video/mp4",
            //"man": "text/troff",
            //"mathml": "application/mathml+xml",
            //"mbox": "application/mbox",
            //"mdoc": "text/troff",
            //"me": "text/troff",
            //"mid": "audio/midi",
            //"midi": "audio/midi",
            //"mime": "message/rfc822",
            //"mml": "application/mathml+xml",
            //"mng": "video/x-mng",
            //"mov": "video/quicktime",
            //"mp3": "audio/mpeg",
            //"mp4": "video/mp4",
            //"mp4v": "video/mp4",
            //"mpeg": "video/mpeg",
            //"mpg": "video/mpeg",
            //"ms": "text/troff",
            //"msi": "application/x-msdownload",
            //"odp": "application/vnd.oasis.opendocument.presentation",
            //"ods": "application/vnd.oasis.opendocument.spreadsheet",
            //"odt": "application/vnd.oasis.opendocument.text",
            //"ogg": "application/ogg",
            //"p": "text/x-pascal",
            //"pas": "text/x-pascal",
            //"pbm": "image/x-portable-bitmap",
            //"pdf": "application/pdf",
            //"pem": "application/x-x509-ca-cert",
            //"pgm": "image/x-portable-graymap",
            //"pgp": "application/pgp-encrypted",
            //"pkg": "application/octet-stream",
            //"pl": "text/x-script.perl",
            //"pm": "text/x-script.perl-module",
            //"png": "image/png",
            //"pnm": "image/x-portable-anymap",
            //"ppm": "image/x-portable-pixmap",
            //"pps": "application/vnd.ms-powerpoint",
            //"ppt": "application/vnd.ms-powerpoint",
            //"ps": "application/postscript",
            //"psd": "image/vnd.adobe.photoshop",
            //"py": "text/x-script.python",
            //"qt": "video/quicktime",
            //"ra": "audio/x-pn-realaudio",
            //"rake": "text/x-script.ruby",
            //"ram": "audio/x-pn-realaudio",
            //"rar": "application/x-rar-compressed",
            //"rb": "text/x-script.ruby",
            //"rdf": "application/rdf+xml",
            //"roff": "text/troff",
            //"rpm": "application/x-redhat-package-manager",
            //"rss": "application/rss+xml",
            //"rtf": "application/rtf",
            //"ru": "text/x-script.ruby",
            //"s": "text/x-asm",
            //"sgm": "text/sgml",
            //"sgml": "text/sgml",
            //"sh": "application/x-sh",
            //"sig": "application/pgp-signature",
            //"snd": "audio/basic",
            //"so": "application/octet-stream",
            //"svg": "image/svg+xml",
            //"svgz": "image/svg+xml",
            //"swf": "application/x-shockwave-flash",
            //"t": "text/troff",
            //"tar": "application/x-tar",
            //"tbz": "application/x-bzip-compressed-tar",
            //"tcl": "application/x-tcl",
            //"tex": "application/x-tex",
            //"texi": "application/x-texinfo",
            //"texinfo": "application/x-texinfo",
            //"text": "text/plain",
            //"tif": "image/tiff",
            //"tiff": "image/tiff",
            //"torrent": "application/x-bittorrent",
            //"tr": "text/troff",
            //"txt": "text/plain",
            //"vcf": "text/x-vcard",
            //"vcs": "text/x-vcalendar",
            //"vrml": "model/vrml",
            //"war": "application/java-archive",
            //"wav": "audio/x-wav",
            //"wma": "audio/x-ms-wma",
            //"wmv": "video/x-ms-wmv",
            //"wmx": "video/x-ms-wmx",
            //"wrl": "model/vrml",
            //"wsdl": "application/wsdl+xml",
            //"xbm": "image/x-xbitmap",
            //"xhtml": "application/xhtml+xml",
            //"xls": "application/vnd.ms-excel",
            //"xml": "application/xml",
            //"xpm": "image/x-xpixmap",
            //"xsl": "application/xml",
            //"xslt": "application/xslt+xml",
            //"yaml": "text/yaml",
            //"yml": "text/yaml",
            //"zip": "application/zip",
            "css": "text/css",
            "htm": "text/html",
            "html": "text/html",
            "ico": "image/vnd.microsoft.icon",
            "js": "application/javascript"
        },
        getContentType = function (file) {
            var extension = path.extname(file);
            if (extension.indexOf(extensionDelimiter) === 0) {
                extension = extension.substr(extensionDelimiterLength); // Remove ".".
            }
            return contentTypes[extension.toLowerCase()];
        },
        status = jsMVC.status,
        notFound = function (response) {
            response.writeHead(status.notFound);
            response.end();
        },
        mapPath = function (urlPath, appPath) {
            if (!isString(appPath)) {
                appPath = jsMVC.config.appPath;
            }
            return isString(appPath) ? path.resolve(appPath, urlPath) : urlPath;
        },
        FileResult = (function () {
            var constructor = function (event, filePath, appPath) {
                this.event = event;
                this.filePath = mapPath(filePath, appPath);
            };
            constructor.prototype = {
                constructor: constructor,
                execute: function () {
                    var response = this.event.response,
                        filePath = this.filePath,
                        type = getContentType(filePath);
                    if (!type) {
                        notFound(response);
                    } else {
                        fs.readFile(filePath, function (error, data) {
                            if (error) {
                                notFound(response);
                            } else {
                                response.writeHead(status.ok, {
                                    "Content-Type": type,
                                    "Content-Length": data.length
                                });
                                response.end(data);
                            }
                        });
                    }
                }
            };
            return constructor;
        }());

    jsMVC.event.FileResult = function (filePath, appPath) {
        return new FileResult(this, filePath, appPath);
    };

}(this.window, !this.window && require, this.jsMVC || exports));

﻿/// <reference path="jsMVC.js"/>
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

    var fireObservable = function (observable, eventType, newValue, oldValue, key) {
        forEachItem(observable._eventListeners[eventType], function (listener) {
            listener.call(observable, newValue, oldValue, eventType, key);
        });
        if (arguments.length > 4) {
            forEachItem(observable._keyEventListeners[eventType][key], function (listener) {
                listener.call(observable, newValue, oldValue, eventType, key);
            });
        }
    };

    var addObservableKeyEventListener = function (observable, eventType, listener, key) {
        var keyListeners = observable._keyEventListeners[eventType];
        if (!nativeHasOwn.call(keyListeners, key)) {
            keyListeners[key] = [];
        }
        keyListeners[key].push(listener);
    };

    var addObservableEventListener = function (observable, eventType, listener) {
        observable._eventListeners[eventType].push(listener);
    };

    var removeObservableKeyListeners = function (observable, key) {
        forEachKey(observable._keyEventListeners, function (eventType) {
            observable._keyEventListeners[eventType][key] = [];
        });
    };

    var removeObservableKeyEventListeners = function (observable, eventType, key) {
        if (eventType in observable._keyEventListeners) {
            var eventListeners = observable._keyEventListeners[eventType];
            if (key in eventListeners) {
                eventListeners[key] = [];
            }
        }
    };

    var removeObservableEventListener = function (observable, eventType, listener) {
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

    var removeObservableEventListeners = function (observable, eventType) {
        var eventListeners = observable._eventListeners;
        if (eventType in eventListeners) {
            eventListeners[eventType] = [];
        }
    };

    var removeObservableKeyEventListener = function (observable, eventType, listener, key) {
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

    var removeObservableListener = function (observable, listener) {
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
        forEachKey(observable._keyEventListeners, function (eventType, eventListeners) {
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
    };

    var Observable = (function () {
        var constructor = function (data, asCopy) {
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
            forEachKey(eventTypes, function (eventType) {
                that._eventListeners[eventType] = [];
            });

            this._keyEventListeners = {};
            forEachKey(eventTypes, function (keyEventType) {
                that._keyEventListeners[keyEventType] = {};
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
                    fireObservable(this, eventTypes.change, value, oldValue, key);
                }
                return this;
            },

            add: function () {
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
                    this.on(eventTypes.change, function (newValue, oldValue, eventType, changedKey) {
                        if (indexOf(dependentKeys, changedKey) >= 0) {
                            this.set(key, getter.apply(this, getArrayValues(this.data, dependentKeys)));
                        }
                    });
                    fireObservable(this, eventTypes.add, value, undefined, key);
                }

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
                fireObservable(this, eventTypes.add, item, undefined, index);
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
                    for (index = 0; index < keys.length; index++) {
                        this.removeAt(keys[index]);
                    }
                } else {
                    if (arguments.length < 1) {
                        // removeAll() for object.
                        keys = [];
                        forEachKey(this.data, function (key) {
                            keys.push(key);
                        });
                    }
                    // removeAll(keys) for object.
                    forEachItem(keys, function (key) {
                        this.remove(key);
                    });
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
                fireObservable(this, eventTypes.remove, undefined, value, index);
                removeObservableKeyListeners(this, index);
            },

            on: function (eventType, listener, key) { // listener: (newValue, oldValue, event, key)
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

            off: function () {
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

            sort: function (callback) {
                // TODO: Implement.
            }
        };
        return constructor;
    }());

    var isObservable = function (object) {
        return object && object.constructor === Observable;
    };

    var getValue = function (data, key) {
        return isObservable(data) ? data.get(key) : data[key];
    };

    // /Observable

    // Exports
    jsMVC.Observable = function (data) {
        return new Observable(data);
    };
    jsMVC.Observable.eventTypes = eventTypes;
    jsMVC.isObservable = isObservable;

    _.getValue = getValue;
    // /Exports

}(this.window, !this.window && require, this.jsMVC || exports));

﻿/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.observable.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    if (!browser) {
        return;
    }

    // Imports
    var document = browser.document,
        jQuery = browser.jQuery,
        _ = jsMVC._,
        noop = _.noop,
        error = _.error,
        forEachItem = _.forEachItem,
        forEachKey = _.forEachKey,
        isFunction = _.isFunction,
        isObject = _.isObject,
        isArray = _.isArray,
        isNumber = _.isNumber,
        getValue = _.getValue,
        observableEventTypes = jsMVC.Observable.eventTypes,
        isObservable = jsMVC.isObservable,
        // Other utilities
        hasKey = function (object) {
            var result = false;
            forEachKey(object, function () {
                result = true;
                return false; // break forEachKey.
            });
            return result;
        },
        nativeTrim = String.prototype.trim,
        trim = nativeTrim ? function (value) {
            return nativeTrim.call(value);
        } : function (value) {
            return value.replace(/^\s+|\s+$/g, "");
        },
        // Constants.
        testElement = document.createElement("div"),
        dataPrefix = "data-",
        bindKey = "bind",
        eachKey = "each",
        bindBackKey = "bindback",
        dataBindKey = dataPrefix + bindKey,
        dataEachKey = dataPrefix + eachKey,
        dataBindBackKey = dataPrefix + bindBackKey,
        declarationSeperator = ";",
        keyValueSeparator = ":",
        pathKeySeparator = ".",
        domEventTypes = {
            // http://www.quirksmode.org/dom/events/index.html
            blur: true,
            change: true,
            click: true,
            contextmenu: true,
            copy: true,
            cut: true,
            dbclick: true,
            error: true,
            focus: true,
            focusin: true,
            focusout: true,
            hashchange: true,
            keydown: true,
            keypress: true,
            keyup: true,
            load: true,
            mousedown: true,
            mouseenter: true,
            mouseleave: true,
            mousemove: true,
            mouseout: true,
            mouseover: true,
            mouseup: true,
            mousewheel: true,
            paste: true,
            reset: true,
            resize: true,
            scroll: true,
            select: true,
            submit: true,
            textinput: true,
            unload: true,
            wheel: true
        },
        propertyComplianceMap = (function () {
            var map = {};
            // innerText / textContent
            if (testElement.textContent === undefined && testElement.innerText !== undefined) {
                map.textContent = "innerText";
            } else if (testElement.innerText === undefined && testElement.textContent !== undefined) {
                map.innerText = "textContent";
            }
            return map;
        }()),
        eventTypePrefix = "on",
        bindIdKey = "jsdatabindid",
        dataBindIdKey = dataPrefix + bindIdKey,
        // DOM Utilities
        setElementBindIdAttribute = testElement.dataset ? function (element, bindId) {
            element.dataset[bindIdKey] = bindId;
        } : function (element, bindId) {
            element.setAttribute(dataBindIdKey, bindId);
        },
        getElementBindIdAttribute = function (element) {
            return element.getAttribute(dataBindIdKey);
        },
        removeElementBindIdAttribute = function (element) {
            element.removeAttribute(dataBindIdKey);
        },
        getPropertyBindDeclaration = testElement.dataset ? function (element) {
            return element.dataset[bindKey];
        } : function (element) {
            return element.getAttribute(dataBindKey);
        },
        getPropertyBindBackDeclaration = testElement.dataset ? function (element) {
            return element.dataset[bindBackKey];
        } : function (element) {
            return element.getAttribute(dataBindBackKey);
        },
        getElementBindDeclaration = testElement.dataset ? function (element) {
            return element.dataset[eachKey];
        } : function (element) {
            return element.getAttribute(dataEachKey);
        },
        addEventListener = browser.addEventListener ? function (element, eventTypes, listener) {
            forEachItem(trim(eventTypes).split(/\s+/), function (eventType) { // "click change" -> ["click", "change"]
                element.addEventListener(eventType, listener, false);
            });
        } : (browser.attachEvent ? function (element, eventTypes, listener) {
            forEachItem(trim(eventTypes).split(/\s+/), function (eventType) { // "click change" -> ["click", "change"]
                element.attachEvent(eventTypePrefix + eventType, listener);
            });
        } : noop),
        removeEventListener = browser.removeEventListener ? function (element, eventTypes, listener) {
            forEachItem(trim(eventTypes).split(/\s+/), function (eventType) { // "click change" -> ["click", "change"]
                element.removeEventListener(eventType, listener, false);
            });
        } : (browser.detachEvent ? function (element, eventTypes, listener) {
            forEachItem(trim(eventTypes).split(/\s+/), function (eventType) { // "click change" -> ["click", "change"]
                element.detachEvent(eventTypePrefix + eventType, listener);
            });
        } : noop);

    // Binding utilities

    var bindIdValue = 0;

    var getBindIdValue = function () {
        return ++bindIdValue; // bindIdValue will not be 0.
    };

    var indexRegExp = /(\[\d+\])/g;
    var indexRegExpReplace = ".$1";

    var formatPath = function (value) {
        value = trim(value).replace(indexRegExp, indexRegExpReplace); // [123] -> .[123]
        return value.length > 0 ? value : null;
    };

    var indexKeyRegExp = /^\[\d+\]$/;
    var thisKey = "this";

    var simpleChangeEventHelper = {
        add: function (element, listener) {
            addEventListener(element, "change", listener);
        },
        remove: function (element, listener) {
            removeEventListener(element, "change", listener);
        }
    };
    var complexChangeEventHelper = (function () {
        if (browser.ActiveXObject) {
            // IE
            return document.documentMode === 9 ? { // IE9: propertychange and keyup
                add: function (element, listener) {
                    forEachItem(["propertychange", "keyup"], function (eventType) {
                        element.attachEvent(eventTypePrefix + eventType, listener);
                    });
                },
                remove: function (element, listener) {
                    forEachItem(["propertychange", "keyup"], function (eventType) {
                        element.detachEvent(eventTypePrefix + eventType, listener);
                    });
                }
            } : { // IE6, IE7, IE8, IE10: propertychange
                add: function (element, listener) {
                    element.attachEvent(eventTypePrefix + "propertychange", listener);
                },
                remove: function (element, listener) {
                    element.detachEvent(eventTypePrefix + "propertychange", listener);
                }
            };
        } else {
            // Chrome, firefox, safari: input and blur. No DOM observing, DOMAttrModified/Observer not working.
            return {
                add: function (element, listener) {
                    forEachItem(["input", "blur"], function (eventType) {
                        element.addEventListener(eventType, listener, false);
                    });
                },
                remove: function (element, listener) {
                    forEachItem(["input", "blur"], function (eventType) {
                        element.removeEventListener(eventType, listener, false);
                    });
                }
            };
        }
    }());
    var removeChangeEventListener = browser.ActiveXObject ? function (element, eventType, listener) {
        switch (type) {
            case "propertychange":
            case "keyup":
                element.detachEvent(eventTypePrefix + eventType, listener);
            default:
                removeEventListener(element, eventType, listener);
        }
    } : function (element, event, listener) {
        removeEventListener(element, event.type, listener);
    };
    var isBindBackSupported = function (element, event) {
        switch (event.type) {
            case "propertychange":
                return event.propertyName === "value";
            case "keyup":
            case "change":
            case "input":
            case "blur":
                var tagName = element.tagName,
                    support = bindBackSupportMap[tagName];
                if (tagName === "INPUT") {
                    support = support[element.type];
                }
                return support;
            default:
                return false;
        }
    };
    var bindBackSupportMap = {
        TEXTAREA: {
            // Safari - textInput
            value: simpleChangeEventHelper
        },
        OUTPUT: {
            value: simpleChangeEventHelper
        },
        SELECT: {
            selectedIndex: simpleChangeEventHelper
        },
        OPTION: {
            selected: simpleChangeEventHelper
        },
        INPUT: {
            radio: {
                checked: simpleChangeEventHelper
            },
            checkbox: {
                checked: simpleChangeEventHelper
            },
            text: {
                value: complexChangeEventHelper
            },
            password: {
                value: complexChangeEventHelper
            },
            color: {
                value: simpleChangeEventHelper
            },
            date: {
                value: simpleChangeEventHelper
            },
            datetime: {
                value: simpleChangeEventHelper
            },
            "datetime-local": {
                value: simpleChangeEventHelper
            },
            email: {
                value: simpleChangeEventHelper
            },
            month: {
                value: simpleChangeEventHelper
            },
            number: {
                value: simpleChangeEventHelper
            },
            range: {
                value: simpleChangeEventHelper
            },
            search: {
                value: simpleChangeEventHelper
            },
            tel: {
                value: simpleChangeEventHelper
            },
            time: {
                value: simpleChangeEventHelper
            },
            url: {
                value: simpleChangeEventHelper
            },
            week: {
                value: simpleChangeEventHelper
            }
        }
        // TODO: keygen, datalist
    };

    var getChangeEventListenerHelper = function (element, elementPath) {
        var tagName = element.tagName,
            supportHelper = bindBackSupportMap[tagName];
        if (!supportHelper) {
            return null;
        }
        if (tagName === "INPUT") {
            supportHelper = supportHelper[element.type];
            if (!supportHelper) {
                return null;
            }
        }
        return supportHelper[elementPath];
    };

    var getPathKeys = function (path, format) {
        if (format) {
            path = formatPath(path); // [123] -> .[123]
        }
        if (!path) {
            return null;
        }
        var keys = path.split(pathKeySeparator);
        if (keys[0] === thisKey) {
            keys = keys.slice(1); // remove beginning "this".
        }
        forEachItem(keys, function (key, index) {
            if (indexKeyRegExp.test(key)) { // "[123]" -> Number(123)
                keys[index] = parseInt(key.substring(1, key.length - 1), 10);
            }
        });
        return keys;
    };

    var getPropertyMap = function (declarations, dataPathPrefix) {
        var dataKeys;
        if (!declarations) {
            return null;
        }
        declarations = declarations.split(declarationSeperator);
        var propertyMap = {};
        for (var index = 0; index < declarations.length; index++) {
            var declaration = declarations[index].split(keyValueSeparator); // TODO: Consider /\s*:\s*/
            if (declaration.length !== 2) {
                error("Bind declaration '" + declaration + "' must be valid.");
            }
            var elementPath = formatPath(declaration[0]);
            if (!elementPath) {
                error("Element path of bind declaration '" + declaration + "' must be valid.");
            }
            dataKeys = getPathKeys(declaration[1], true);
            if (!dataKeys) {
                error("Data path of bind declaration '" + declaration + "' must be valid.");
            }
            if (dataPathPrefix) {
                dataKeys = dataPathPrefix.concat(dataKeys);
            }
            propertyMap[elementPath] = dataKeys;
        }
        return index > 0 ? propertyMap : null;
    };

    // /Binding utilities

    // Binding cache

    var propertyBindingCache = {};

    var pushPropertyBinding = function (binding) {
        var bindId = binding.id;
        if (bindId in propertyBindingCache) {
            error("Property binding (id: " + bindId + ") must has unique id.");
        }
        propertyBindingCache[bindId] = binding;
    };

    var getPropertyBinding = function (bindId) {
        return propertyBindingCache[bindId];
    };

    var destroyPropertyBinding = function (bindId) {
        var propertyBinding = getPropertyBinding(bindId);
        if (!propertyBinding) {
            return;
        }
        if (propertyBinding.eventListeners) {
            forEachKey(propertyBinding.eventListeners, function (key, eventListener) {
                removeEventListener(propertyBinding.element, key, eventListener);
                delete propertyBinding.eventListeners[key];
            });
            delete propertyBinding.eventListeners;
        }

        if (propertyBinding.propertyBackMap) {
            forEachKey(propertyBinding.propertyBackMap, function (elementPath) {
                var changeEventListenerHelper = getChangeEventListenerHelper(propertyBinding.element, elementPath);
                changeEventListenerHelper.remove(propertyBinding.element, setDataPropertyListener);
                delete propertyBinding.propertyBackMap[elementPath];
            });
            delete propertyBinding.propertyBackMap;
        }

        delete propertyBinding.data;
        delete propertyBinding.element;
        delete propertyBinding.id;

        delete propertyBindingCache[bindId];
    };

    var elementBindingCache = {};

    var pushElementBinding = function (binding) {
        var bindId = binding.id;
        if (bindId in elementBindingCache) {
            error("Element binding (id: " + bindId + ") must has unique id.");
        }
        elementBindingCache[bindId] = binding;
    };

    var getElementBinding = function (bindId) {
        return elementBindingCache[bindId];
    };

    var destroyElementBinding = function (bindId) {
        var elementBinding = getElementBinding(bindId);

        if (!elementBinding) {
            return;
        }

        delete elementBinding.id;
        delete elementBinding.template;
        delete elementBinding.parentElement;
        delete elementBinding.templateChildCount;

        delete elementBindingCache[bindId];
    };

    // /Binding cache

    // Element binding

    var setElement = function (newValue, oldValue, eventType, index, parentElement, template, templateChildCount) {
        var nodeIndex = index * templateChildCount;
        switch (eventType) {
            case observableEventTypes.add:
                var itemFragment = template.cloneNode(true);
                bindElementAndChildren(itemFragment, newValue);
                var nextSilbling = parentElement.childNodes[nodeIndex];
                parentElement.insertBefore(itemFragment, nextSilbling ? nextSilbling : null);
                break;
            case observableEventTypes.remove:
                for (var count = 0; count < templateChildCount; count++) {
                    var childToRemove = parentElement.childNodes[nodeIndex];
                    bindElementAndChildren(childToRemove, undefined);
                    parentElement.removeChild(childToRemove);
                }
                break;
            case observableEventTypes.change:
                for (count = nodeIndex; count < nodeIndex + templateChildCount; count++) {
                    var child = parentElement.childNodes[count];
                    bindElementAndChildren(child, undefined);
                    bindElementAndChildren(child, newValue);
                }
                break;
            default:
                break;
        }
    };

    var addElementsForArray = function (item, itemIndex) {
        setElement(item, undefined, observableEventTypes.add, itemIndex, this.parentElement, this.template, this.templateChildCount);
    };

    var setElementListener = function (newValue, oldValue, eventType, key) {
        var dataScope,
            index;
        forEachKey(this._elementMaps, function (bindId, dataKeys) {
            var elementBinding = getElementBinding(bindId);
            if (elementBinding) {
                if (dataKeys.length === 0) {
                    if (this.isArray) {
                        setElement(newValue, oldValue, eventType, key, elementBinding.parentElement, elementBinding.template, elementBinding.templateChildCount);
                    }
                } else {
                    // Add element binding info on new observable tree.
                    dataScope = newValue;
                    for (index = 1; dataScope && index < dataKeys.length; index++) {
                        if (isObservable(dataScope)) {
                            if (!dataScope._elementMaps) {
                                // _elementMaps is with setElementListener.
                                dataScope._elementMaps = {};
                                dataScope.on(observableEventTypes.add, setElementListener);
                                dataScope.on(observableEventTypes.remove, setElementListener);
                                dataScope.on(observableEventTypes.change, setElementListener);
                            }
                            dataScope._elementMaps[bindId] = dataKeys.slice(index);
                        }
                        dataScope = getValue(dataScope, dataKeys[index]);
                    }
                    if (index === dataKeys.length && (eventType === observableEventTypes.change || eventType === observableEventTypes.add)) {
                        if (isObservable(dataScope)) {
                            if (dataScope.isArray) {
                                if (!dataScope._elementMaps) {
                                    // _elementMaps is with setElementListener.
                                    dataScope._elementMaps = {};
                                    dataScope.on(observableEventTypes.add, setElementListener);
                                    dataScope.on(observableEventTypes.remove, setElementListener);
                                    dataScope.on(observableEventTypes.change, setElementListener);
                                }
                                dataScope._elementMaps[bindId] = [];
                                dataScope.forEach(addElementsForArray, elementBinding);
                            }
                        } else {
                            if (isArray(dataScope)) {
                                forEachItem(dataScope, addElementsForArray, elementBinding);
                            }
                        }
                    }

                    // Remove element binding info on new observable tree.
                    dataScope = oldValue;
                    for (index = 1; dataScope && index < dataKeys.length; index++) {
                        if (isObservable(dataScope)) {
                            if (bindId in dataScope._elementMaps) {
                                delete dataScope._elementMaps[bindId];
                            }
                            if (!hasKey(dataScope._elementMaps)) {
                                // _elementMaps is with setElementListener.
                                delete dataScope._elementMaps;
                                dataScope.off(observableEventTypes.add, setElementListener);
                                dataScope.off(observableEventTypes.remove, setElementListener);
                                dataScope.off(observableEventTypes.change, setElementListener);
                            }
                        }
                        dataScope = getValue(dataScope, dataKeys[index]);
                    }
                }
            } else {
                delete this._elementMaps[bindId];
                if (!hasKey(this._elementMaps)) {
                    // _elementMaps is with setElementListener.
                    delete this._elementMaps;
                    this.off(observableEventTypes.add, setElementListener);
                    this.off(observableEventTypes.remove, setElementListener);
                    this.off(observableEventTypes.change, setElementListener);
                }
            }
        }, this);
    };

    var ElementBinding = function (bindId, dataKeys, data, parentElement) {
        var isObservingArray = false,
            index,
            dataScope = data,
            dataKey,
            templateFragment = document.createDocumentFragment(),
            childCount = 0;

        for (var child = parentElement.firstChild; child; child = parentElement.firstChild) { // TODO: Improve performance.
            if (child.nodeType === 1 || child.nodeType === 3) { // Only keep element node and text node.
                templateFragment.appendChild(child);
                childCount++;
            } else {
                parentElement.removeChild(child);
            }
        }
        if (childCount === 0) {
            return; // No template to do do element binding.
        }

        for (index = 0; dataScope && index < dataKeys.length; index++) { // keys is "a" or "a.b"
            dataKey = dataKeys[index];
            if (isObservable(dataScope)) {
                isObservingArray = true;
                if (!dataScope._elementMaps) {
                    dataScope._elementMaps = {};
                    dataScope.on(observableEventTypes.add, setElementListener);
                    dataScope.on(observableEventTypes.remove, setElementListener);
                    dataScope.on(observableEventTypes.change, setElementListener);
                }
                dataScope._elementMaps[bindId] = dataKeys.slice(index);
            }
            dataScope = getValue(dataScope, dataKey);
        }

        if (index === dataKeys.length) {
            if (isObservable(dataScope)) {
                if (dataScope.isArray) {
                    isObservingArray = true;
                    if (!dataScope._elementMaps) {
                        dataScope._elementMaps = {};
                        dataScope.on(observableEventTypes.add, setElementListener);
                        dataScope.on(observableEventTypes.remove, setElementListener);
                        dataScope.on(observableEventTypes.change, setElementListener);
                    }
                    dataScope._elementMaps[bindId] = [];
                    dataScope.forEach(function (item, itemIndex) {
                        setElement(dataScope.get(itemIndex), undefined, observableEventTypes.add, itemIndex, parentElement, templateFragment, childCount);
                    });
                }
            } else {
                if (isArray(dataScope)) {
                    for (index = 0; index < dataScope.length; index++) {
                        setElement(dataScope[index], undefined, observableEventTypes.add, index, parentElement, templateFragment, childCount);
                    }
                }
            }
        }

        if (isObservingArray) {
            this.id = bindId;
            this.template = templateFragment;
            this.parentElement = parentElement;
            this.templateChildCount = childCount;
        }
    };

    // /Element binding

    // Property binding

    var setElementProperty = function (element, elementPath, value, eventListeners) {
        var elementKeys = getPathKeys(elementPath); // TODO: format?
        var elementScope = element;
        for (var index = 0; elementScope && index < elementKeys.length - 1; index++) {
            elementScope = elementScope[elementKeys[index]];
        }
        if (!elementScope) {
            return;
        }
        var elementKey = elementKeys[index];
        if (elementKeys.length === 1 && domEventTypes[elementKey]) {
            // elementKeys[0] is event - remove and set.
            if (!isFunction(value)) {
                error("Event '" + elementKey + "' must bind to function.");
            }
            if (eventListeners) {
                var listenerToRemove = eventListeners[elementKey];
                if (listenerToRemove) {
                    removeEventListener(element, elementKey, listenerToRemove);
                }
                eventListeners[elementKey] = value;
            }
            addEventListener(element, elementKey, value);
        } else {
            // elementKey is property - set.
            // Check compatibility,
            // for example, in IE6 textContent should be replaced with innerText; in Firefox, innerText should be replaced with textContent.
            elementScope[propertyComplianceMap[elementKey] || elementKey] = value;
        }
    };

    var setElementPropertyListener = function (newValue, oldValue, eventType, key) {
        var propertyBinding,
            dataScope,
            index,
            currentMap;

        forEachKey(this._propertyMaps, function (bindId, propertyMap) { // TODO: O(N^3), consider improve.
            propertyBinding = getPropertyBinding(bindId);
            if (propertyBinding) {
                forEachKey(propertyMap, function (elementPath, dataKeys) {
                    if (dataKeys.length === 1 && dataKeys[0] === key) { // key is "a", dataPath is "a"
                        setElementProperty(propertyBinding.element, elementPath, newValue, propertyBinding.eventListeners);
                    } else if (dataKeys.length > 1 && dataKeys[0] === key) { // key is "a", dataPath is "a.b.c"
                        // Add property binding info on new observable tree.
                        dataScope = newValue;
                        for (index = 1; dataScope && index < dataKeys.length; index++) {
                            if (isObservable(dataScope)) {
                                if (!dataScope._propertyMaps) {
                                    // _propertyMaps is with setElementPropertyListener.
                                    dataScope._propertyMaps = {};
                                    dataScope.on(observableEventTypes.change, setElementPropertyListener);
                                    dataScope.on(observableEventTypes.remove, setElementPropertyListener);
                                    dataScope.on(observableEventTypes.add, setElementPropertyListener);
                                }
                                if (!(bindId in dataScope._propertyMaps)) {
                                    dataScope._propertyMaps[bindId] = {};
                                }
                                dataScope._propertyMaps[bindId][elementPath] = dataKeys.slice(index);
                            }
                            dataScope = getValue(dataScope, dataKeys[index]);
                        }
                        if (index === dataKeys.length && (eventType === observableEventTypes.change || eventType === observableEventTypes.add)) {
                            setElementProperty(propertyBinding.element, elementPath, dataScope, propertyBinding.eventListeners);
                        }

                        // Remove property binding info on old observable tree.
                        dataScope = oldValue;
                        for (index = 1; dataScope && index < dataKeys.length; index++) {
                            if (isObservable(dataScope)) {
                                currentMap = dataScope._propertyMaps[bindId];
                                if (currentMap) {
                                    delete currentMap[elementPath];
                                }
                                if (!hasKey(currentMap)) {
                                    delete dataScope._propertyMaps[bindId];
                                }
                                if (!hasKey(dataScope._propertyMaps)) {
                                    // _propertyMaps is with setElementPropertyListener.
                                    delete dataScope._propertyMaps;
                                    dataScope.off(observableEventTypes.change, setElementPropertyListener);
                                    dataScope.off(observableEventTypes.remove, setElementPropertyListener);
                                    dataScope.off(observableEventTypes.add, setElementPropertyListener);
                                }
                            }
                            dataScope = getValue(dataScope, dataKeys[index]);
                        }
                    }
                });
            } else {
                delete this._propertyMaps[bindId];
                if (!hasKey(this._propertyMaps)) {
                    // _propertyMaps is with setElementPropertyListener.
                    delete this._propertyMaps;
                    this.off(observableEventTypes.change, setElementPropertyListener);
                    this.off(observableEventTypes.remove, setElementPropertyListener);
                    this.off(observableEventTypes.add, setElementPropertyListener);
                }
            }
        }, this);
    };

    var setDataValueByKey = function (data, key, value) {
        if (isObservable(data)) {
            data.set(key, value);
        } else if (isObject(data)) {
            data[key] = value;
        }
    };

    var setDataProperty = function (data, dataKeys, value) {
        var dataScope = data;
        for (var index = 0; dataScope && index < dataKeys.length - 1; index++) {
            dataScope = getValue(dataScope, dataKeys[index]);
        }
        setDataValueByKey(dataScope, dataKeys[index], value);
    };

    var setDataPropertyListener = function (event) {
        event = event || browser.event;
        var element = event.target || event.srcElement;
        if (!element) {
            return;
        }
        if (element.nodeType === 3) { // Safari BUG
            element = element.parentNode;
        }
        if (!isBindBackSupported(element, event)) {
            return;
        }
        var bindId = getElementBindIdAttribute(element);
        var binding = getPropertyBinding(bindId);
        if (!binding) {
            // This element has no binding.
            removeChangeEventListener(element, event.type, setDataPropertyListener);
            return;
        }
        // This element has binding.
        var data = binding.data;
        forEachKey(binding.propertyBackMap, function (elementPath, dataKeys) {
            setDataProperty(data, dataKeys, element[elementPath]);
        });
    };

    var PropertyBinding = function (bindId, propertyMap, propertyBackMap, data, element) {
        var isObservingData = false,
            isObservingElement = false,
            dataScope,
            observeDataPath,
            index,
            dataKey,
            eventListeners = {},
            changeEventListenerHelper;

        if (propertyMap) {
            forEachKey(propertyMap, function (elementPath, dataKeys) {
                dataScope = data;
                observeDataPath = false;

                // Add binding info to observable tree.
                for (index = 0; dataScope && index < dataKeys.length; index++) { // keys is "a" or "a.b"
                    dataKey = dataKeys[index];
                    if (isObservable(dataScope)) {
                        observeDataPath = true;
                        isObservingData = true;
                        if (!dataScope._propertyMaps) {
                            // _propertyMaps is with setElementPropertyListener.
                            dataScope._propertyMaps = {};
                            dataScope.on(observableEventTypes.change, setElementPropertyListener); // a -> b
                            dataScope.on(observableEventTypes.remove, setElementPropertyListener); // a -> undefined
                            dataScope.on(observableEventTypes.add, setElementPropertyListener); // undefined -> a
                        } // else: already has _propertyMaps with setElementPropertyListener.
                        if (!(bindId in dataScope._propertyMaps)) {
                            dataScope._propertyMaps[bindId] = {};
                        }
                        dataScope._propertyMaps[bindId][elementPath] = dataKeys.slice(index);
                    }
                    dataScope = getValue(dataScope, dataKey);
                }
                if (index === dataKeys.length) {
                    setElementProperty(element, elementPath, dataScope, observeDataPath ? eventListeners : undefined);
                }
            });
        }

        if (propertyBackMap) {
            forEachKey(propertyBackMap, function (elementPath, dataKeys) {
                // Not tree here.
                changeEventListenerHelper = getChangeEventListenerHelper(element, elementPath);
                if (changeEventListenerHelper) {
                    isObservingElement = true;
                    changeEventListenerHelper.add(element, setDataPropertyListener);
                    setDataProperty(data, dataKeys, element.value);
                }
            });
        }

        if (isObservingData) {
            this.element = element; // Need to find element.
            this.eventListeners = eventListeners;
        }

        if (isObservingElement) {
            this.data = data;
            this.propertyBackMap = propertyBackMap;
        }

        if (isObservingData || isObservingElement) {
            setElementBindIdAttribute(element, bindId);
            this.id = bindId;
        }
    };

    // /Property binding

    // Bind

    var bindElement = function (element, data, dataPathPrefix) { // TODO: data-context
        var bindId,
            binding,
            declaration,
            propertyMap,
            propertyBackMap,
            bindChildren = true,
            hasBinding = false;
        if (element.nodeType !== 1) {
            return bindChildren;
        }
        bindId = getElementBindIdAttribute(element);
        if (data === undefined) { // Unbind.
            if (!bindId) {
                return bindChildren;
            }
            destroyPropertyBinding(bindId);
            destroyElementBinding(bindId);
            removeElementBindIdAttribute(element);
        } else { // Bind.
            if (bindId) {
                error("'element' already has data binding.");
            }
            // properties: data-bind, data-bindback
            declaration = getPropertyBindDeclaration(element);
            propertyMap = getPropertyMap(declaration, dataPathPrefix);
            declaration = getPropertyBindBackDeclaration(element);
            propertyBackMap = getPropertyMap(declaration, dataPathPrefix);
            if (propertyMap || propertyBackMap) {
                bindId = getBindIdValue();
                binding = new PropertyBinding(bindId, propertyMap, propertyBackMap, data, element);
                if (binding.id) {
                    pushPropertyBinding(binding);
                    hasBinding = true;
                }
            }

            // element: data-each
            declaration = getElementBindDeclaration(element);
            if (declaration) {
                var eachKeys = getPathKeys(declaration, true);
                if (!eachKeys) {
                    error("Each declaration '" + declaration + "' must be valid.");
                }
                bindId = bindId || getBindIdValue();
                binding = new ElementBinding(bindId, eachKeys, data, element);
                if (binding.id) {
                    pushElementBinding(binding);
                    hasBinding = true;
                }
                bindChildren = false;
            }
            if (hasBinding) {
                setElementBindIdAttribute(element, bindId);
            }
        }
        return bindChildren;
    };

    var bindSiblingElements = function (siblings, data, dataPathPrefix) {
        forEachItem(siblings, function (element) {
            if (element.nodeType === 1) {
                bindElementAndChildren(element, data, dataPathPrefix);
            }
        });
    };

    var bindElementAndChildren = function (element, data, dataPathPrefix) {
        var bindChildren = bindElement(element, data, dataPathPrefix);
        if (bindChildren && element.hasChildNodes) {
            bindSiblingElements(element.childNodes, data, dataPathPrefix);
        }
    };

    // /Bind

    // Bind root

    var bind = function (root, data) {
        var index;
        if (root.nodeType) { // Single node.
            bindElementAndChildren(root, data);
        } else if (isNumber(root.length)) { // Node collection.
            var rootElements = root;
            if (rootElements.length < 1) { // Node collection is empty.
                return; // Do nothing.
            }
            if (arguments.length > 1) {
                for (index = 0; index < rootElements.length - 1; index++) {
                    if (rootElements[index].nextSibling !== rootElements[index + 1]) {
                        error("When 'root' is a collection of DOM elements, the elements must be siblings under one parent node.");
                    }
                }
            }
            bindSiblingElements(rootElements, data);
        } else {
            error("'root' must be DOM element or collection of DOM sibling elements.");
        }
    };

    var unbind = function (root) {
        bind(root, undefined);
    };

    // /Bind root

    // TODO: data-context, data-section, data-if, data-else, data-else-if, data-source, converter

    // TODO: use $(element).data(binding), $(element).on(event, listener)

    // Exports.

    jsMVC.bind = bind;
    jsMVC.unbind = unbind;

    if (jQuery) {
        jQuery.fn.dataBind = function (data) {
            return this.each(function () {
                bind(this, data);
            });
        };
        jQuery.fn.dataUnbind = function () {
            return this.each(function () {
                unbind(this);
            });
        };
    }

    // /Exports.
}(this.window, !this.window && require, this.jsMVC || exports));

﻿/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.event.js"/>
/// <reference path="jsMVC.routing.js"/>
/// <reference path="jsMVC.routing.browser.js"/>
/// <reference path="jsMVC.routing.node.js"/>
/// <reference path="jsMVC.controller.js"/>
/// <reference path="jsMVC.controller.event.js"/>
/// <reference path="jsMVC.controller.event.browser.js"/>
/// <reference path="jsMVC.controller.event.node.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    // Imports.
    var nativeHasOwn = Object.prototype.hasOwnProperty,
        _ = jsMVC._,
        trigger = _.trigger,
        listen = _.listen,
        executeGlobalErrorFilters = _.executeGlobalErrorFilters,
        isString = _.isString,
        forEachItem = _.forEachItem,
        forEachKey = _.forEachKey,
        copyProps = _.copyProperties,
        isObject = _.isObject,
        status = jsMVC.status,
        pushArea = jsMVC.Area,
        pushController = jsMVC.Controller,
        pushRoute = jsMVC.Route,
        pushFilter = jsMVC.Filter,
        idKey = "id",
        // Local variables.
        isReady = false,
        configKeys = {
            areas: pushArea,
            controllers: pushController,
            routes: pushRoute
        },
        ready = function (callback) {
            // Side effects.
            // Hook up Routing with browser's hashchange event.
            jsMVC.on("request", function (event) {
                var virtualPath = event.virtualPath,
                    routeData = event.routeData;
                if (routeData) {
                    routeData.dataTokens.event = event;
                    try {
                        routeData.routeHandler(routeData, virtualPath);
                    } catch (err) {
                        event.status = status.internalError;
                        event.error = err;
                        trigger("fail", event);
                    }
                } else {
                    trigger("fail", event);
                }
            }).on("fail", function (event) {
                event.status = status.badRequest;
                event.error = new Error("Route cannot be found.");
                executeGlobalErrorFilters(event);
            });
            listen(callback);

            if (browser) {
                trigger("request", jsMVC.current());
            }
        },
        config = function (options) {
            if (node && isString(options)) { // configs is a path.
                options = node(options);
            }
            if (isObject(options)) {
                // TODO: support reset.

                // Filters.
                forEachItem(options.filters, function (filter) {
                    pushFilter(filter);
                });
                // Areas, controllers, routes.
                forEachKey(configKeys, function (configKey, pushMethod) {
                    forEachKey(options[configKey], function (optionsKey, optionsValue) {
                        if (!nativeHasOwn.call(optionsValue, idKey)) {
                            optionsValue[idKey] = optionsKey;
                        }
                        pushMethod(optionsValue);
                    });
                });

                copyProps(config, options);
            }

            if (!isReady) {
                isReady = true;
                ready(options && options.ready);
            }
            return jsMVC;
        };

    // Exports.
    jsMVC.config = config;

}(this.window, !this.window && require, this.jsMVC || exports));
