/*global module */

(function () {
    "use strict";

    exports = module.exports = {
        appPath: "../",
        routes: {
            browserTest: {
                url: "browser/{action}",
                defaults: {
                    controller: "browser",
                    action: "source"
                }
            },
            catchAll: {
                url: "{*path}",
                defaults: {
                    controller: "file",
                    action: "read"
                }
            }
        },
        controllers: {
            browser: {
                actions: {
                    source: function (event) {
                        return event.FileResult("run/browser.source.htm");
                    }
                }
            },
            file: {
                actions: {
                    read: function (event) {
                        return event.FileResult(event.routeData.values.path);
                    }
                }
            }
        },
        ready: function (event) {
            var server = event.target;
            server.listen(global.process.env.PORT || 8000, global.process.env.IP); // Cloud9 uses process.env.PORT and process.env.IP.
        }
    };
}());
