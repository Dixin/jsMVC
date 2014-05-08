/// <reference path="jsMVC.js"/>
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
    } : removeEventListener;
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
