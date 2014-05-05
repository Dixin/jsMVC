﻿(function () {
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
                        return event.file("run/browser.source.htm");
                    }
                }
            },
            file: {
                actions: {
                    read: function (event) {
                        return event.file(event.routeData.values.path);
                    }
                }
            }
        },
        ready: function (server) {
            server.listen(process.env.PORT || 8000, process.env.IP); // Cloud9 uses process.env.PORT and process.env.IP.
        }
    };
}());
