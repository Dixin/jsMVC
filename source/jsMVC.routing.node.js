/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.routing.js"/>

(function(browser, node, jsMVC, undefined) {
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
        normalizeEvent = function(options) {
            var event = new Event(),
                request,
                virtualPath;
            options = options || {};
            request = options.request;
            virtualPath = options.virtualPath;
            if (virtualPath === undefined) {
                virtualPath = request ? url.parse(request.url).pathname : null;
                if (virtualPath && virtualPath.substr(0, prefixLength) === prefix) {
                    virtualPath = virtualPath.substr(prefixLength); // Remove starting "/"
                }
            }
            return copyProps(event, {
                type: request ? request.method : options.type,
                target: options.server,
                currentTarget: options.server,
                virtualPath: virtualPath,
                routeData: virtualPath ? routeTable.getRouteData(virtualPath) : null,

                request: request,
                response: options.response
            });
        },
        listen = function(callback) {
            var serverDomain = domain.create();
            serverDomain.run(function() {
                var server = http.createServer().on("request", function(request, response) {
                    var requestDomian = domain.create(),
                        event = normalizeEvent({
                            request: request,
                            response: response,
                            domain: requestDomian,
                            server: this // server.
                        });
                    requestDomian.add(request);
                    requestDomian.add(response);
                    requestDomian.on("error", function(error) {
                        try {
                            event.status = status.internalError;
                            event.error = error;
                            trigger("fail", event);
                            response.on("close", function() {
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

    jsMVC.go = function(destination, options, filter) {
        var virtualPathData;
        options = options || {};
        switch (type(destination)) {
            case "string":
                trigger("request", normalizeEvent({
                    virtualPath: destination
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
