/// <reference path="jsMVC.js"/>
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

                request: null,
                response: null,
                serverDomain: null,
                requestDomain: null
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
                callback(normalizeEvent());
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
