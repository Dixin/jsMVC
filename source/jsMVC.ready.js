/// <reference path="jsMVC.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";

    // Imports.
    var _ = jsMVC._,
        trigger = _.trigger,
        listen = _.listen,
        executeGlobalErrorFilters = _.executeGlobalErrorFilters,
        status = jsMVC.status,
        // Local variables.
        isReady = false,
        ready = function(callback) {
            if (!isReady) {
                isReady = true;
                // Side effects.
                // Hook up Routing with browser's hashchange event.
                jsMVC.on("request", function(event) {
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
                }).on("fail", function(event) {
                    event.status = status.badRequest;
                    event.error = new Error("Route cannot be found.");
                    executeGlobalErrorFilters(event);
                });
                listen(callback);

                if (browser) {
                    trigger("request", jsMVC.current());
                }
            }
            return jsMVC;
        };

    // Exports.
    jsMVC.ready = ready;

}(this.window, !this.window && require, this.jsMVC || exports));
