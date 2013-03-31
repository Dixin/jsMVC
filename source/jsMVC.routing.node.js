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
        server,
        normalizeEvent = function(options) {
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

                referrerUrl = request.headers['referer'] || request.headers['Referer'];
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
        listen = function(callback) {
            var serverDomain = domain.create();
            serverDomain.run(function() {
                server = http.createServer().on("request", function(request, response) {
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

    jsMVC.go = function(destination, options) {
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
