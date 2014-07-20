/// <reference path="jsMVC.js"/>
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
        server = null,
        serverDomain = null,
        normalizeEvent = function (options) {
            var event = new Event(),
                process = global.process,
                requestDomain = process.domain,
                attachment = requestDomain._jsMVC,
                request,
                requestedUrl,
                virtualPath,
                referrerUrl;

            options = options || {};

            if (!attachment) {
                // In the context of server.
                return copyProps(event, {
                    type: null,
                    // timeStamp is already in event.
                    target: server,
                    currentTarget: server,
                    virtualPath: null,
                    routeData: null,

                    newHref: null,
                    oldHref: null,
                    newHash: null,
                    oldHash: null,

                    request: null,
                    response: null,
                    serverDomain: serverDomain,
                    requestDomain: null
                });
            }

            // In the context of request.
            request = attachment.request;
            requestedUrl = url.parse(options.newHref || request.url);
            virtualPath = options.virtualPath || requestedUrl.pathname;
            referrerUrl = options.referrerUrl || request.headers.referer || request.headers.Referer;

            requestedUrl.protocol = request.connection.encrypted ? "https" : "http";
            requestedUrl.host = request.headers.host;

            referrerUrl = referrerUrl !== undefined ? url.parse(referrerUrl) : {};

            if (virtualPath && virtualPath.substr(0, prefixLength) === prefix) {
                virtualPath = virtualPath.substr(prefixLength); // Remove starting "/".
            }

            return copyProps(event, {
                type: request.method,
                // timeStamp is already in event.
                target: server,
                currentTarget: server,
                virtualPath: virtualPath,
                routeData: virtualPath ? routeTable.getRouteData(virtualPath) : null,

                newHref: url.format(requestedUrl),
                oldHref: referrerUrl.href,
                newHash: requestedUrl.hash,
                oldHash: referrerUrl.hash,

                request: request,
                response: attachment.response,
                serverDomain: serverDomain,
                requestDomain: requestDomain
            });
        },
        listen = function (callback) {
            serverDomain = domain.create();

            serverDomain.run(function () {
                server = http.createServer().on("request", function (request, response) {
                    var requestDomian = domain.create();
                    requestDomian.add(request);
                    requestDomian.add(response);
                    requestDomian._jsMVC = {
                        request: request,
                        response: response
                    };

                    requestDomian.on("error", function (error) {
                        try {
                            var event = normalizeEvent();
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

                    requestDomian.run(function () {
                        trigger("request", normalizeEvent());
                    });
                });

                if (isFunction(callback)) {
                    callback(normalizeEvent());
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
