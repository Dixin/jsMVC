(function() {
    exports = module.exports = {
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
            },
        },
        controllers: {
            browser: {
                actions: {
                    source: function(event) {
                        return event.file("./browser.source.htm");
                    }
                }
            },
            file: {
                actions: {
                    read: function(event) {
                        return event.file("../" + event.routeData.values.path);
                    }
                }
            }
        }
    };
}());
