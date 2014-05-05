/// <reference path="../tools/_references.js"/>
/// <reference path="../source/_references.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    QUnit.module("jsMVC.controller");

    var noop = function () {
    },
        $ = browser ? browser.jQuery : node("../tools/node_modules/jquery-deferred"),
        delay = function (callback) {
            return $.Deferred(function (deferred, time) {
                time = time || 110;
                setTimeout(function () {
                    callback();
                    deferred.resolve();
                }, time);
            }).promise();
        },
        cleanUpHash = function () {
            browser.location.hash = "";
        };

    test("Can map mvc route.", function () {
        strictEqual(jsMVC.routeTable.length(), 0);
        var route1 = jsMVC.Route({
            id: "r1",
            url: "{culture}/{controller}/{action}/{id}",
            defaults: {
                culture: "en-US",
                controller: "a",
                action: "b"
            },
            constraints: {
                action: "[a]{1,3}"
            },
            dataTokens: {
                x: "1"
            }
        });
        var route2 = jsMVC.routeTable.get("r1");
        strictEqual(route1, route2);
        deepEqual(route1, route2);
        strictEqual(route2.dataTokens.x, "1");

        jsMVC.routeTable.clear();
        strictEqual(jsMVC.routeTable.length(), 0);
    });

    test("Can create area.", function () {
        var result;
        result = jsMVC.Area({
            id: "area1"
        });
        strictEqual(result.id, "area1");
        try {
            result = jsMVC.Area({
                id: "area1"
            });
            ok(false);
        } catch (e) {
        }
        result = jsMVC.Area({
            id: "area3"
        });
        strictEqual(result.id, "area3");
        try {
            result = jsMVC.Area({
                id: "area/4"
            });
            ok(false);
        } catch (e) {
        }
        try {
            result = jsMVC.Area({
                id: ""
            });
            ok(false);
        } catch (e) {
        }
    });

    test("Can map route on area.", function () {
        strictEqual(jsMVC.routeTable.length(), 0);
        var route1 = jsMVC.Area({
            id: "area11"
        }).Route({
            id: "r1",
            url: "{culture}/{controller}/{action}/{id}",
            defaults: {
                culture: "en-US",
                controller: "a",
                action: "b"
            },
            constraints: {
                action: "[a]{1,3}"
            },
            dataTokens: {
                x: "1"
            }
        });
        var route2 = jsMVC.routeTable.get("r1");
        strictEqual(route1, route2);
        deepEqual(route1, route2);
        strictEqual(route2.dataTokens.x, "1");
        strictEqual(route1.dataTokens.area, "area11");
        strictEqual(route2.dataTokens.area, "area11");
        jsMVC.routeTable.clear();
        strictEqual(jsMVC.routeTable.length(), 0);
    });

    asyncTest("Can create and invoke controller.", 23, function () {
        var count = 0;

        strictEqual(jsMVC.routeTable.length(), 0);

        var controller1 = jsMVC.Controller({
            id: "c1",
            actions: {
                a1: function () {
                    count++;
                    strictEqual(count, 1);
                },
                a2: function () {
                    count++;
                    strictEqual(count, 2);
                }
            }
        });
        strictEqual(controller1.id, "c1");
        strictEqual(controller1.virtualPath, "c1");
        strictEqual(controller1.getAction("a1").id, "a1");
        strictEqual(controller1.getAction("a2").id, "a2");
        strictEqual(controller1.getAction("a3"), undefined);
        deepEqual(controller1.getFilters(), []);
        deepEqual(controller1.getAction("a1").getFilters(), []);
        deepEqual(controller1.getAction("a2").getFilters(), []);

        var controller2 = jsMVC.Controller({
            id: "c2",
            actions: {
                a1: function () {
                    count++;
                    strictEqual(count, 4);
                    return {
                        execute: function () {
                            jsMVC.routeTable.clear();
                            strictEqual(jsMVC.routeTable.length(), 0);
                            if (browser) {
                                cleanUpHash();
                            }
                            start();
                        }
                    };
                },
                a2: function () {
                    count++;
                    strictEqual(count, 3);
                }
            }
        });
        strictEqual(controller2.id, "c2");
        strictEqual(controller2.virtualPath, "c2");
        strictEqual(controller2.getAction("a1").id, "a1");
        strictEqual(controller2.getAction("a2").id, "a2");
        strictEqual(controller2.getAction("a0"), undefined);
        deepEqual(controller2.getFilters(), []);
        deepEqual(controller2.getAction("a1").getFilters(), []);
        deepEqual(controller2.getAction("a2").getFilters(), []);

        var route = jsMVC.Route({
            id: "r1",
            url: "{controller}/{action}"
        });

        strictEqual(jsMVC.routeTable.get("r1"), route);

        delay(function () {
            jsMVC.go({
                controller: "c1",
                action: "a1"
            });
        }).then(function () {
            return delay(function () {
                jsMVC.go({
                    controller: "c1",
                    action: "a2"
                });
            });
        }).then(function () {
            return delay(function () {
                jsMVC.go({
                    controller: "c2",
                    action: "a2"
                });
            });
        }).then(function () {
            return delay(function () {
                jsMVC.go({
                    controller: "c2",
                    action: "a1"
                });
            });
        });
    });

    asyncTest("Can create and invoke controller on area.", 2, function () {
        strictEqual(jsMVC.routeTable.length(), 0);

        var area = jsMVC.Area({
            id: "area111"
        });
        area.Route({
            id: "area111",
            url: "{language}-{region}/{controller}/{action}/{id}",
            defaults: {
                id: undefined
            }
        });
        var c11 = area.Controller({
            id: "c11"
        });
        var a111 = c11.Action({
            id: "a111",
            execute: function () {
                jsMVC.routeTable.clear();
                strictEqual(jsMVC.routeTable.length(), 0);
                if (browser) {
                    cleanUpHash();
                }
                start();
            }
        });

        jsMVC.go({
            language: "en",
            region: "us",
            controller: "c11",
            action: "a111"
        }, function (route) {
            return route.dataTokens.area === "area111";
        });
    });

    asyncTest("Can execute filter.", 4, function () {
        var count = 0;
        var run = false;
        strictEqual(jsMVC.routeTable.length(), 0);

        var route1 = jsMVC.Route({
            id: "r1",
            url: "{controller}/{action}/{id}",
            defaults: {
                id: undefined
            }
        });
        jsMVC.Filter({
            error: function () {
                if (!run) {
                    return {
                        execute: noop
                    };
                }
                count++;
                strictEqual(count, 2);
                run = false;
                jsMVC.routeTable.clear();
                strictEqual(jsMVC.routeTable.length(), 0);
                if (browser) {
                    cleanUpHash();
                }
                start();
                return {
                    execute: noop
                };
            }
        });
        jsMVC.Controller({
            id: "c1111",
            actions: {
                a1111: function () {
                    count++;
                    strictEqual(count, 1);
                    run = true;
                }
            }
        });
        delay(function () {
            jsMVC.go({
                controller: "c1111",
                action: "a1111"
            });
        }).then(function () {
            return delay(function () {
                jsMVC.go({
                    controller: "c1111",
                    action: "a2222"
                });
            });
        });
    });

    test("Can config MVC.", function () {
        strictEqual(jsMVC.routeTable.length(), 0);

        jsMVC.config({
            filters: [{
                beforeAction: noop
            }],
            areas: {
                configTestArea1: {
                    filters: [{
                        beforeAction: noop
                    }],
                    controllers: {
                        c: {
                            actions: {
                                d: noop
                            }
                        }
                    },
                    routes: {
                        configTestArea1Route: {
                            url: "configTestArea1/{controller}/{action}/{id}",
                            defaults: {
                                controller: "c",
                                action: "d"
                            }
                        }
                    }
                }
            },
            controllers: {
                a: {
                    actions: {
                        b: {
                            execute: noop,
                            filters: [{
                                beforeAction: noop
                            }]
                        },
                        index: noop
                    }
                }
            },
            routes: {
                configTestRoute1: {
                    url: "{controller}/{action}/{id}",
                    defaults: {
                        controller: "a",
                        action: "b"
                    }
                }
            }
        });

        strictEqual(jsMVC.routeTable.length(), 2);
        strictEqual(jsMVC.routeTable.get("configTestRoute1").url, "{controller}/{action}/{id}");
        strictEqual(jsMVC.routeTable.get("configTestArea1Route").url, "configtestarea1/{controller}/{action}/{id}");

        strictEqual(jsMVC.getFilters().length, 2);
        strictEqual(typeof jsMVC.getFilters()[1].beforeAction, "function");

        strictEqual(jsMVC.getArea("configTestArea1").id, "configtestarea1");
        strictEqual(jsMVC.getArea("configTestArea1").getController("c").id, "c");
        strictEqual(jsMVC.getArea("configTestArea1").getController("c").getAction("d").id, "d");

        strictEqual(jsMVC.getController("a").id, "a");
        strictEqual(jsMVC.getController("a").getAction("b").id, "b");
        strictEqual(jsMVC.getController("a").getAction("index").id, "index");

        jsMVC.routeTable.clear();
        strictEqual(jsMVC.routeTable.length(), 0);
    });

}(this.window, !this.window && require, this.jsMVC || jsMVC));
