/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";

    // Imports.
    var nativeHasOwn = Object.prototype.hasOwnProperty,
        _ = jsMVC._,
        noop = _.noop,
        error = _.error,
        forEachKey = _.forEachObjectKey,
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
        getSegmentLiteral = function(segmentLiteral) {
            // Scan for errant single { and } and convert double {{ to { and double }} to }
            // First we eliminate all escaped braces and then check if any other braces are remaining
            var newLiteral = segmentLiteral.replace(doubleOpeningFlag, emptyString).replace(doubleClosingFlag, emptyString);
            if (newLiteral.indexOf(openingFlag) !== -1 || newLiteral.indexOf(closingFlag) !== -1) {
                return null;
            }
            // If it's a valid format, we unescape the braces
            return segmentLiteral.replace(doubleOpeningFlag, openingFlag).replace(doubleClosingFlag, closingFlag);
        },
        isParameterNameValid = function(parameterName) {
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
        getIndexOfFirstOpenParameter = function(segment, startIndex) {
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
        ParameterSubsegment = function(parameterName) {
            this.isCatchAll = false;
            if (parameterName.charAt(0) === catchAllFlag) {
                parameterName = parameterName.substr(1);
                this.isCatchAll = true;
            }

            this.type = parameterType;
            this.value = parameterName;
        },
        getUrlSubsegments = function(part) {
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
        getUrlParts = function(url) {
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
        getUrlSegments = function(urlParts) {
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
        isSegmentCatchAll = function(segment) {
            return some(segment.value, function(subsegment) {
                return subsegment.type === parameterType && subsegment.isCatchAll;
            });
        },
        isUrlSubsegmentsValid = function(pathSubsegments, usedParameterNames) {
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
        isParameterSubsegmentCatchAll = function(subsegment) {
            return subsegment.isCatchAll === true;
        },
        isUrlPartsValid = function(parts) {
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
        getParsedSegments = function(routeUrl) {
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
        getRouteValues = function(values) {
            var routeValues;
            if (!values) {
                return {};
            }
            if (!isObject(values)) {
                error("'values' must be plain object.");
            }
            routeValues = {};
            forEachKey(values, function(key, value) {
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
        matchCatchAllSegment = function(contentPathSegment, remainingRequestSegments, defaultValues, matchedValues) {
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
        matchContentSegment = function(routeSegment, requestPathSegment, defaultValues, matchedValues) {
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
        matchSegments = function(pathSegments, virtualPath, defaultValues) {
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
                forEachKey(defaultValues, function(defaultKey, defaultValue) {
                    if (!nativeHasOwn.call(matchedValues, defaultKey)) {
                        matchedValues[defaultKey] = defaultValue;
                    }
                });
            }

            return matchedValues;
        },
        forEachParameterSubsegment = function(pathSegments, callback) {
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
        getParameterSubsegment = function(pathSegments, parameterName) {
            var foundParameterSubsegment = null;

            forEachParameterSubsegment(pathSegments, function(parameterSubsegment) {
                if (parameterName === parameterSubsegment.value) {
                    foundParameterSubsegment = parameterSubsegment;
                    return false;
                } else {
                    return true;
                }
            });

            return foundParameterSubsegment;
        },
        isParameterRequired = function(parameterSubsegment, defaultValues) {
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
        isRoutePartNonEmpty = function(routePart) {
            if (isString(routePart)) {
                return routePart.length > 0;
            }
            return !!routePart;
        },
        areRoutePartsEqual = function(a, b) {
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
        encodeUrl = browser ? function(url) {
            return url; // For browser hash, no need to encode.
        } : encodeURIComponent, // Encode for server side.
        escapeUrlDataString = browser ? function(value) {
            return value; // For browser hash, no need to escape.
        } : node("querystring").escape, // Escape for server side.
        bind = function(pathSegments, currentValues, values, defaultValues, constraints) {
            currentValues = currentValues || {};
            values = values || {};
            defaultValues = defaultValues || {};

            // The set of values we should be using when generating the URL in this route
            var acceptedValues = {};

            // Keep track of which new values have been used
            var unusedNewValues = {};
            forEachKey(values, function(key) {
                unusedNewValues[key] = null;
            });

            // Step 1: Get the list of values we're going to try to use to match and generate this URL

            // Find out which entries in the URL are valid for the URL we want to generate.
            // If the URL had ordered parameters a="1", b="2", c="3" and the new values
            // specified that b="9", then we need to invalidate everything after it. The new
            // values should then be a="1", b="9", c=<no value>.
            forEachParameterSubsegment(pathSegments, function(parameterSubsegment) {
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
            forEachKey(values, function(newKey, newValue) {
                if (isRoutePartNonEmpty(newValue)) {
                    if (!nativeHasOwn.call(acceptedValues, newKey)) {
                        acceptedValues[newKey] = newValue;
                    }
                }
            });

            // Add all current values that aren't in the URL at all
            forEachKey(currentValues, function(currentKey, currentValue) {
                var parameterName2 = currentKey;
                if (!nativeHasOwn.call(acceptedValues, parameterName2)) {
                    var parameterSubsegment2 = getParameterSubsegment(pathSegments, parameterName2);
                    if (parameterSubsegment2 === null) {
                        acceptedValues[parameterName2] = currentValue.Value;
                    }
                }
            });

            // Add all remaining default values from the route to the list of values we will use for URL generation
            forEachParameterSubsegment(pathSegments, function(parameterSubsegment) {
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
            var hasAllRequiredValues = forEachParameterSubsegment(pathSegments, function(parameterSubsegment) {
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
            forEachParameterSubsegment(pathSegments, function(parameterSubsegment) {
                delete otherDefaultValues[parameterSubsegment.value];
                return true;
            });

            var shouldReturnNull = false;
            forEachKey(otherDefaultValues, function(defaultKey, defaultValue) {
                if (nativeHasOwn.call(values, defaultKey)) {
                    delete unusedNewValues[defaultKey];
                    if (!areRoutePartsEqual(values[defaultKey], defaultValue)) {
                        // If there is a non-parameterized value in the route and there is a
                        // new value for it and it doesn't match, this route won't match.
                        shouldReturnNull = true;
                        return true;
                    }
                }
                return false;
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
                forEachKey(constraints, function(constraintKey) {
                    delete unusedNewValues[constraintKey];
                });
            }

            // Add remaining new values as query string parameters to the URL
            if (unusedNewValues) {
                // Generate the query string
                var firstParam = true;
                forEachKey(unusedNewValues, function(unusedNewValue) {
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
        RouteData = function(route, routeHandler, values, dataTokens) {
            this.route = route;
            this.routeHandler = routeHandler;
            this.values = values;
            this.dataTokens = dataTokens;
        },
        // /RouteData.

        // VirtualPathData.
        VirtualPathData = function(route, virtualPath, dataTokens /* optional */) {
            this.route = route;
            this.virtualPath = virtualPath;
            this.dataTokens = dataTokens;
        },
        // /VirtualPathData.

        // Route.
        processConstraint = function(route, constraint, virtualPath, parameterName, values, isIncomingRequest) {
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
        processConstraints = function(route, constraints, virtualPath, values, isIncomingRequest) {
            var result = true;
            forEachKey(constraints, function(key, value) {
                if (!processConstraint(route, value, virtualPath, key, values, isIncomingRequest)) {
                    result = false;
                    return true; // break;
                }
                return false;
            });
            return result;
        },
        Route = (function() {
            var constructor = function(url, defaults /* optional */, constraints, dataTokens, routeHandler, name) {
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

                getVirtualPathData: function(routeValues, currentRouteValues /* optional */) {
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

                getRouteData: function(virtualPath) {
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
        IgnoreRoute = (function() {
            var constructor = function(url, constraints  /* optional */) {
                Route.call(this, url, {}, constraints, {}, noop);
            };

            constructor.prototype = {
                constructor: constructor,
                // routeData.routeHandler is always noop.
                getVirtualPathData: function() {
                    return null;
                },

                getRouteData: Route.prototype.getRouteData
            };

            return constructor;
        }()),
        RouteTable = function() {
            var namedRoutes = {},
                allRoutes = [];

            this.getRouteData = function(virtualPath) {
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

            this.getVirtualPathData = function(routeValues, currentRouteValues, filter /* optional */) {
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

            this.push = function(route) {
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

            this.get = function(key) {
                // Key should be either name or index.
                if (isString(key)) {
                    var lowerCaseKey = key.toLowerCase();
                    return namedRoutes[lowerCaseKey];
                }
                return allRoutes[key];
            };

            this.ignore = function(url, constraints /* optional */) {
                return this.push(new IgnoreRoute(url, constraints));
            };

            this.clear = function() {
                namedRoutes = {};
                allRoutes = [];
            };

            this.length = function() {
                return allRoutes.length;
            };

            this.Route = function(url, defaults /* optional */, constraints, dataTokens, routeHandler, name) {
                return new Route(url, defaults /* optional */, constraints, dataTokens, routeHandler, name);
            };
        };
    // /RouteCollection.

    // Exports.
    jsMVC.routeTable = new RouteTable();

    copyProps(_, {
        getUrlParts: getUrlParts,
        getSegmentLiteral: getSegmentLiteral,
        getIndexOfFirstOpenParameter: getIndexOfFirstOpenParameter,
        getUrlSubsegments: getUrlSubsegments,
        isUrlSubsegmentsValid: isUrlSubsegmentsValid,
        isUrlPartsValid: isUrlPartsValid,
        matchSegments: matchSegments,
        getParsedSegments: getParsedSegments,
        forEachParameterSubsegment: forEachParameterSubsegment,
        encodeUrl: encodeUrl,
        escapeUrlDataString: escapeUrlDataString
    });

}(this.window, !this.window && require, this.jsMVC || exports));
