/// <reference path="jsMVC.js"/>
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
