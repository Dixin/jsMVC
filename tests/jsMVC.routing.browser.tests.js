/// <reference path="../tools/_references.js"/>
/// <reference path="../source/_references.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";
    
    if (!browser) {
        // Not in browser.
        return;
    }

    QUnit.module("jsMVC.routing.browser");

    var routeTable = jsMVC.routeTable,
        current = jsMVC.current,
        Route = jsMVC.routeTable.Route,
        go = jsMVC.go,
        fail = jsMVC.fail,
        cleanUpHash = function() {
            browser.location.hash = "";
        },
        delay = function(callback) {
            return $.Deferred(function(deferred, time) {
                time = time || 150;
                browser.setTimeout(function() {
                    callback();
                    deferred.resolve();
                }, time);
            }).promise();
        };

    asyncTest("Can go to destination", function() {
        var result,
            hash = browser.location.hash.substr(1);

        strictEqual(routeTable.length(), 0);

        routeTable.push(new Route("abc/{b}/{c}"), "r1");
        strictEqual(routeTable.length(), 1);

        routeTable.push(new Route("{a}/{c}/{d}"), "r2");
        strictEqual(routeTable.length(), 2);

        result = go("somewhere");
        strictEqual(result, true);
        strictEqual(current().virtualPath, "somewhere");
        strictEqual(current().routeData, null);

        result = go("somewhere2?a=b");
        strictEqual(result, true);
        strictEqual(current().virtualPath, "somewhere2");
        strictEqual(current().newHash, "somewhere2?a=b");
        strictEqual(current().routeData, null);

        result = go({ b: "x", c: "y" });
        strictEqual(result, true);
        strictEqual(current().virtualPath, "abc/x/y");
        deepEqual(current().routeData.values, { b: "x", c: "y" });

        result = go({ a: 1, b: "x", c: "y" });
        strictEqual(result, true);
        strictEqual(current().virtualPath, "abc/x/y");
        strictEqual(current().newHash, "!abc/x/y?a=1");
        deepEqual(current().routeData.values, { b: "x", c: "y" });

        // IE6 / IE7 / Chrome / Safari / Opera does not support programatically go back / forward.
        if (go(-1)) {
            strictEqual(current().virtualPath, "abc/x/y");
            deepEqual(current().routeData.values, { b: "x", c: "y" });
        }

        if (go(-1)) {
            strictEqual(current().virtualPath, "somewhere2");
            strictEqual(current().newHash, "somewhere2?a=b");
            strictEqual(current().routeData, null);
        }

        if (go(-1)) {
            strictEqual(current().virtualPath, "somewhere");
            strictEqual(current().routeData, null);
        }

        if (go(-1)) {
            strictEqual(current().virtualPath, hash);
            strictEqual(current().routeData, null);
        }

        if (go(1)) {
            strictEqual(current().virtualPath, "somewhere");
            strictEqual(current().routeData, null);
        }

        if (go(-1)) {
            strictEqual(current().virtualPath, hash);
            strictEqual(current().routeData, null);
        }

        routeTable.clear();
        strictEqual(routeTable.length(), 0);

        cleanUpHash();
        start();
    });

    asyncTest("Can ignore query", function() {
        var result;

        strictEqual(routeTable.length(), 0);

        routeTable.push(new Route("abc/{b}/{c}"), "r1");
        strictEqual(routeTable.length(), 1);

        routeTable.push(new Route("{a}/{c}/{d}"), "r2");
        strictEqual(routeTable.length(), 2);

        result = go("somewhere");
        strictEqual(result, true);
        strictEqual(current().virtualPath, "somewhere");
        strictEqual(current().routeData, null);

        result = go("somewhere2?a=b");
        strictEqual(result, true);
        strictEqual(current().virtualPath, "somewhere2");
        strictEqual(current().newHash, "somewhere2?a=b");
        strictEqual(current().routeData, null);

        result = go({ b: "x", c: "y" });
        strictEqual(result, true);
        strictEqual(current().virtualPath, "abc/x/y");
        deepEqual(current().routeData.values, { b: "x", c: "y" });

        result = go({ a: 1, b: "x", c: "y" });
        strictEqual(result, true);
        strictEqual(current().virtualPath, "abc/x/y");
        strictEqual(current().newHash, "!abc/x/y?a=1");
        deepEqual(current().routeData.values, { b: "x", c: "y" });

        routeTable.clear();
        strictEqual(routeTable.length(), 0);
        cleanUpHash();
        delay(start);
    });

    asyncTest("Can fire route handler", function() {
        var result,
            count = 0,
            runFail = true,
            asyncCleanUp = function() {
                routeTable.clear();
                strictEqual(routeTable.length(), 0);
                cleanUpHash();
                runFail = false;
                start();
            },
            routeValues = [
                { a: "x", b: "y", c: "z" },
                { a: "1", b: "m", c: "n" }
            ],
            virtualPaths = ["x/y/z", "1/m/n"],
            hashValues = ["!x/y/z", "!1/m/n?d=dd"];

        jsMVC.on("fail", function() {
            if (!runFail) {
                return;
            }
            strictEqual(current().virtualPath, "somewhere");
            strictEqual(current().routeData, null);
        });

        strictEqual(routeTable.length(), 0);

        var route1 = new Route("{a}/{b}/{c}", {}, {}, {}, function(routeData, virtualPath) {
            deepEqual(routeData.values, routeValues[count]);
            deepEqual(routeData.dataTokens.event.virtualPath, virtualPath);
            strictEqual(virtualPath, virtualPaths[count]);
            strictEqual(current().newHash, hashValues[count]);
            strictEqual(routeData.route, route1);
            ++count;
            if (count === 2) {
                asyncCleanUp();
            }
        });
        routeTable.push(route1, "r1");
        strictEqual(routeTable.length(), 1);

        result = go("somewhere");
        strictEqual(result, true);

        // If changing hash fast, the timing of location.hash will be messed up.
        delay(function() {
            result = go({ a: "x", b: "y", c: "z" });
            strictEqual(result, true);
        }).then(function() {
            delay(function() {
                result = go({ a: 1, b: "m", c: "n", d: "dd" });
                strictEqual(result, true);
            });
        });
    });
}(this.window, !this.window && require, this.jsMVC || jsMVC));
