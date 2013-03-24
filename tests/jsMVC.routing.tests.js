/// <reference path="../tools/_references.js"/>
/// <reference path="../source/_references.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";

    QUnit.module("jsMVC.routing");

    var _ = jsMVC._,
        getUrlParts = _.getUrlParts,
        getSegmentLiteral = _.getSegmentLiteral,
        getIndexOfFirstOpenParameter = _.getIndexOfFirstOpenParameter,
        getUrlSubsegments = _.getUrlSubsegments,
        isUrlSubsegmentsValid = _.isUrlSubsegmentsValid,
        isUrlPartsValid = _.isUrlPartsValid,
        matchSegments = _.matchSegments,
        getParsedSegments = _.getParsedSegments,
        forEachParameterSubsegment = _.forEachParameterSubsegment,
        routeTable = jsMVC.routeTable,
        Route = routeTable.Route,
        noop = _.noop,
        encodeUrl = _.encodeUrl;

    test("Can get URL parts", function() {
        var result;

        result = getUrlParts("a/b/c/d");
        ok(result);
        strictEqual(result.length, 7);
        strictEqual(result[0], "a");
    });

    test("Can get segment literal", function() {
        var result;

        result = getSegmentLiteral("abc");
        strictEqual(result, "abc");

        result = getSegmentLiteral("ab{{c}}");
        strictEqual(result, "ab{c}");

        result = getSegmentLiteral("ab{c");
        strictEqual(result, null);
    });

    test("Can get index of first open parameter", function() {
        var result;

        result = getIndexOfFirstOpenParameter("abc{d}");
        strictEqual(result, 3);

        result = getIndexOfFirstOpenParameter("{a}bc");
        strictEqual(result, 0);

        result = getIndexOfFirstOpenParameter("{a}b{c}");
        strictEqual(result, 0);
    });

    test("Can get URL subsegment", function() {
        var result;

        result = getUrlSubsegments("a{{b}}c{d}efg{h}{i}j");
        strictEqual(result.length, 6);
        strictEqual(result[0].type, "literal");
        strictEqual(result[0].value, "a{b}c");
        strictEqual(result[1].type, "parameter");
        strictEqual(result[1].value, "d");
        strictEqual(result[2].type, "literal");
        strictEqual(result[2].value, "efg");
        strictEqual(result[3].type, "parameter");
        strictEqual(result[3].value, "h");
        strictEqual(result[4].type, "parameter");
        strictEqual(result[4].value, "i");
        strictEqual(result[5].type, "literal");
        strictEqual(result[5].value, "j");

        result = getUrlSubsegments("abc");
        strictEqual(result.length, 1);
        strictEqual(result[0].type, "literal");
        strictEqual(result[0].value, "abc");

        result = getUrlSubsegments("{abc}");
        strictEqual(result.length, 1);
        strictEqual(result[0].type, "parameter");
        strictEqual(result[0].value, "abc");
    });

    test("Can valid URL subsegments", function() {
        var result;

        result = isUrlSubsegmentsValid(getUrlSubsegments("abc"), {});
        strictEqual(result, true);

        result = isUrlSubsegmentsValid(getUrlSubsegments("a{{b}}c{d}efg{h}{i}j"), {});
        strictEqual(result, false);

        result = isUrlSubsegmentsValid(getUrlSubsegments("a{{b}}c{d}efg{b}j"), {});
        strictEqual(result, true);

        result = isUrlSubsegmentsValid(getUrlSubsegments("a{{b}}c{d}efg{h}{d}j"), {});
        strictEqual(result, false);

        result = isUrlSubsegmentsValid(getUrlSubsegments("a{{b}}c{d}efg{h}{*i}"), {});
        strictEqual(result, false);

        result = isUrlSubsegmentsValid(getUrlSubsegments("{*a}"), {});
        strictEqual(result, true);

        result = isUrlSubsegmentsValid(getUrlSubsegments("{a}"), { a: { type: "parameter", value: "a", isCatchAll: false } });
        strictEqual(result, false);
    });

    test("Can valid URL parts", function() {
        var result;

        result = isUrlPartsValid(getUrlParts("abc"), {});
        strictEqual(result, true);

        result = isUrlPartsValid(getUrlParts("a{{b}}c{d}efg{h}{i}j"));
        strictEqual(result, false);

        result = isUrlPartsValid(getUrlParts("a{{b}}c{d}efg{b}j"));
        strictEqual(result, true);

        result = isUrlPartsValid(getUrlParts("a{{b}}c{d}efg{h}{d}j"));
        strictEqual(result, false);

        result = isUrlPartsValid(getUrlParts("a{{b}}c{d}efg{h}{*i}"));
        strictEqual(result, false);

        result = isUrlPartsValid(getUrlParts("{*a}"), {});
        strictEqual(result, true);

        result = isUrlPartsValid(getUrlParts("{a}/{a}"));
        strictEqual(result, false);

        result = isUrlPartsValid(getUrlParts("{a}/{b}"));
        strictEqual(result, true);

        result = isUrlPartsValid(getUrlParts("{a}/{b}/{c}"));
        strictEqual(result, true);

        result = isUrlPartsValid(getUrlParts("a{a}/b{b}/{*c}"));
        strictEqual(result, true);

        result = isUrlPartsValid(getUrlParts("a{a}/b{*b}/{c}"));
        strictEqual(result, false);
    });

    test("Can match segments", function() {
        var result;

        result = matchSegments(getParsedSegments("{a}/{b}/{c}"), "i/j/k");
        deepEqual(result, {
            a: "i",
            b: "j",
            c: "k"
        });

        result = matchSegments(getParsedSegments("a{{b}}c{d}/efg{h}/i"), "a{b}cx/efgyz/i");
        deepEqual(result, {
            d: "x",
            h: "yz"
        });

        result = matchSegments(getParsedSegments("a{{b}}c{d}/efg{h}/i"), "a{b}cx/efgyz/j");
        strictEqual(result, null);

        result = matchSegments(getParsedSegments("a{{b}}c{d}/{e}fgh/i"), "a{b}cx/yzfgh/i");
        deepEqual(result, {
            d: "x",
            e: "yz"
        });

        result = matchSegments(getParsedSegments("a{{b}}c{d}/{*e}"), "a{b}cx/yzfgh/i");
        deepEqual(result, {
            d: "x",
            e: "yzfgh/i"
        });

        result = matchSegments(getParsedSegments("{a}/{b}/{c}"), "", { a: "i", b: "j", c: "k" });
        deepEqual(result, {
            a: "i",
            b: "j",
            c: "k"
        });

        result = matchSegments(getParsedSegments("{a}/{b}/{c}"), "ii/jj", { a: "i", b: "j", c: "k" });
        deepEqual(result, {
            a: "ii",
            b: "jj",
            c: "k"
        });
    });

    test("Can create route and can match", function() {
        var result,
            route;

        route = new Route("{a}/{b}/{c}");
        strictEqual(route.url, "{a}/{b}/{c}");
        result = route.getRouteData("1/2/3");
        deepEqual(result.values, {
            a: "1",
            b: "2",
            c: "3"
        });

        route = new Route("a{{b}}c{d}/efg{h}/i");
        result = route.getRouteData("a{b}cx/efgyz/i");
        deepEqual(result.values, {
            d: "x",
            h: "yz"
        });

        route = new Route("a{{b}}c{d}/efg{h}/i");
        result = route.getRouteData("a{b}cx/efgyz/j");
        strictEqual(result, null);

        route = new Route("a{{b}}c{d}/{e}fgh/i");
        result = route.getRouteData("a{b}cx/yzfgh/i");
        deepEqual(result.values, {
            d: "x",
            e: "yz"
        });

        route = new Route("a{{b}}c{d}/{*e}");
        result = route.getRouteData("a{b}cx/yzfgh/i");
        deepEqual(result.values, {
            d: "x",
            e: "yzfgh/i"
        });

        route = new Route("{a}/{b}/{c}", { a: "i", b: "j", c: "k" }, {}, {}, function() {
        });
        result = route.getRouteData("");
        deepEqual(result.values, {
            a: "i",
            b: "j",
            c: "k"
        });

        route = new Route("{a}/{b}/{c}", { a: "i", b: "j", c: "k" }, {}, {}, function() {
        });
        result = route.getRouteData("ii/jj");
        deepEqual(result.values, {
            a: "ii",
            b: "jj",
            c: "k"
        });
    });

    test("Can have constraints", function() {
        var result,
            route;

        route = new Route("{a}/{b}/{c}", {}, { a: "[0-9]" }, {}, function() {
        });
        strictEqual(route.url, "{a}/{b}/{c}");
        result = route.getRouteData("1/2/3");
        deepEqual(result.values, {
            a: "1",
            b: "2",
            c: "3"
        });

        route = new Route("{a}/{b}/{c}", {}, { a: "[2-9]" }, {}, function() {
        });
        strictEqual(route.url, "{a}/{b}/{c}");
        result = route.getRouteData("1/2/3");
        strictEqual(result, null);

        route = new Route("{a}/{b}/{c}", {}, { a: "\\d" }, {}, function() {
        });
        strictEqual(route.url, "{a}/{b}/{c}");
        result = route.getRouteData("1/2/3");
        deepEqual(result.values, {
            a: "1",
            b: "2",
            c: "3"
        });

        route = new Route("{a}/{b}/{c}", {}, { a: "\\D" }, {}, function() {
        });
        strictEqual(route.url, "{a}/{b}/{c}");
        result = route.getRouteData("1/2/3");
        strictEqual(result, null);
    });

    test("Can for each parameter subsegment", function() {
        var result,
            count = 0;
        result = forEachParameterSubsegment(getParsedSegments("{a}/{b}/{c}"), function() {
            ++count;
            return true;
        });
        strictEqual(result, true);
        strictEqual(count, 3);

        count = 0;
        result = forEachParameterSubsegment(getParsedSegments("a{{b}}c{d}/efg{h}/i"), function() {
            ++count;
            return true;
        });
        strictEqual(result, true);
        strictEqual(count, 2);

        count = 0;
        result = forEachParameterSubsegment(getParsedSegments("a{{b}}c{d}/{*e}"), function() {
            ++count;
            return true;
        });
        strictEqual(result, true);
        strictEqual(count, 2);
    });

    test("Can get virtual path", function() {
        var result,
            route;

        route = new Route("{a}/{b}/{c}");
        result = route.getVirtualPathData({ a: "1", b: "2", c: "3" });
        strictEqual(result.virtualPath, "1/2/3");

        route = new Route("{a}/{b}/{c}");
        result = route.getVirtualPathData({ a: 1, B: 2, c: "3" });
        strictEqual(result.virtualPath, "1/2/3");

        route = new Route("a{{b}}c{d}/efg{h}/i");
        result = route.getVirtualPathData({ d: "x", h: "yz" });
        strictEqual(result.virtualPath, encodeUrl("a{b}cx") + "/efgyz/i");

        route = new Route("a{{b}}c{d}/efg{h}/i");
        result = route.getVirtualPathData({ d: "x", H: "yz" });
        strictEqual(result.virtualPath, encodeUrl("a{b}cx") + "/efgyz/i");

        route = new Route("a{{b}}c{d}/efg{h}/i");
        result = route.getVirtualPathData({ d: 1 });
        strictEqual(result, null);

        route = new Route("a{{b}}c{d}/{*e}");
        result = route.getVirtualPathData({ d: "x", e: "y" });
        strictEqual(result.virtualPath, encodeUrl("a{b}cx") + "/y");

        route = new Route("a{{b}}c{d}/{*e}");
        result = route.getVirtualPathData({ d: "x" });
        strictEqual(result.virtualPath, encodeUrl("a{b}cx"));

        route = new Route("a{{b}}c{d}/{*e}", { e: 2 }, {}, {}, noop);
        result = route.getVirtualPathData({ d: "x" });
        strictEqual(result.virtualPath, encodeUrl("a{b}cx") + "/");

        route = new Route("a{{b}}c{d}/{e}", { e: 2 }, {}, {}, noop);
        result = route.getVirtualPathData({ d: "x" });
        strictEqual(result.virtualPath, encodeUrl("a{b}cx"));

        route = new Route("a{{b}}c{d}/{e}", { e: 2 }, {}, {}, noop);
        result = route.getVirtualPathData({ d: "x", e: 3 });
        strictEqual(result.virtualPath, encodeUrl("a{b}cx") + "/3");

        route = new Route("a{{b}}c{d}/{e}", { e: 2 }, { e: "[2-9]" }, {}, noop);
        result = route.getVirtualPathData({ d: "x", e: 3 });
        strictEqual(result.virtualPath, encodeUrl("a{b}cx") + "/3");

        route = new Route("a{{b}}c{d}/{e}", { e: 2 }, { e: "[2-9]" }, {}, noop);
        result = route.getVirtualPathData({ d: "x", e: 1 });
        strictEqual(result, null);

        route = new Route("a{{b}}c{d}/{e}", { e: 2 }, {
            e: function(value) {
                return value === 123;
            }
        }, {}, noop);
        result = route.getVirtualPathData({ d: "x", e: 123 });
        strictEqual(result.virtualPath, encodeUrl("a{b}cx") + "/123");

        route = new Route("a{{b}}c{d}/{e}", { e: 2 }, {
            e: function(value) {
                return value === 124;
            }
        }, {}, noop);
        result = route.getVirtualPathData({ d: "x", e: 123 });
        strictEqual(result, null);

        route = new Route("a{{b}}c{d}/{e}", { e: 2 }, { e: "[2-9]" }, {}, noop);
        result = route.getVirtualPathData({ d: "x", e: 3, f: 1 });
        strictEqual(result.virtualPath, encodeUrl("a{b}cx") + "/3?f=1");
    });

    test("Can handle special characters", function() {
        var result,
            route;

        route = new Route("{a}/{b}/{c}");
        strictEqual(route.url, "{a}/{b}/{c}");
        result = route.getRouteData("#%123!@#$%^&*()/abc中/文！·#￥%……—*（）");
        deepEqual(result.values, {
            a: "#%123!@#$%^&*()",
            b: "abc中",
            c: "文！·#￥%……—*（）"
        });

        route = new Route("{a}/{b}/{c}");
        result = route.getVirtualPathData({ a: "#%123!@#$%^&*()", b: "abc中", c: "文！·#￥%……—*（）" });
        strictEqual(result.virtualPath, encodeUrl("#%123!@#$%^&*()") + "/" + encodeUrl("abc中") + "/" + encodeUrl("文！·#￥%……—*（）"));
    });

    test("Can handle query strings", function() {
        var result,
            route;

        route = new Route("{a}/{b}/{c}");
        strictEqual(route.url, "{a}/{b}/{c}");
        result = route.getRouteData("1/2/3?4=5&6=7&8");
        deepEqual(result.values, {
            a: "1",
            b: "2",
            c: "3?4=5&6=7&8"
        });

        route = new Route("{a}/{b}/{c}");
        result = route.getVirtualPathData({
            a: "1",
            b: "2",
            c: "3",
            d: "4",
            e: "5",
            f: undefined,
            g: null
        });
        strictEqual(result.virtualPath, "1/2/3?d=4&e=5");
    });

    test("Route table can work", function() {
        var result;

        strictEqual(routeTable.length(), 0);

        routeTable.push(new Route("abc/{b}/{c}"), {}, {}, {}, noop, "r1");
        strictEqual(routeTable.length(), 1);

        routeTable.push(new Route("{a}/{b}/{c}"), {}, {}, {}, noop, "r2");
        strictEqual(routeTable.length(), 2);

        result = routeTable.getRouteData("x/y/z");
        deepEqual(result.values, { a: "x", b: "y", c: "z" });

        result = routeTable.getRouteData("abc/y/z");
        deepEqual(result.values, { b: "y", c: "z" });

        routeTable.clear();
        strictEqual(routeTable.length(), 0);

        routeTable.push(new Route("{a}/{b}/{c}"), {}, {}, {}, noop, "r2");
        strictEqual(routeTable.length(), 1);

        routeTable.push(new Route("abc/{b}/{c}"), {}, {}, {}, noop, "r1");
        strictEqual(routeTable.length(), 2);

        result = routeTable.getRouteData("abc/y/z");
        deepEqual(result.values, { a: "abc", b: "y", c: "z" });

        result = routeTable.getRouteData("x/y/z");
        deepEqual(result.values, { a: "x", b: "y", c: "z" });

        routeTable.clear();
        strictEqual(routeTable.length(), 0);
    });

    test("Route table can get virtual path", function() {
        var result;

        strictEqual(routeTable.length(), 0);

        routeTable.push(new Route("{a}/{b}/{c}"), {}, {}, {}, noop, "r1");
        result = routeTable.getVirtualPathData({ a: 1, b: 2, c: "3" });
        strictEqual(result.virtualPath, "1/2/3");

        routeTable.push(new Route("abc/{b}/{c}"), {}, {}, {}, noop, "r2");
        result = routeTable.getVirtualPathData({ a: 1, b: 2, c: "3" });
        strictEqual(result.virtualPath, "1/2/3");

        result = routeTable.getVirtualPathData({ b: 2, c: "3" });
        strictEqual(result.virtualPath, "abc/2/3");

        routeTable.clear();
        strictEqual(routeTable.length(), 0);

        routeTable.push(new Route("abc/{b}/{c}"), {}, {}, {}, noop, "r2");
        result = routeTable.getVirtualPathData({ a: 1, b: 2, c: "3" });
        strictEqual(result.virtualPath, "abc/2/3?a=1");

        routeTable.push(new Route("{a}/{b}/{c}"), {}, {}, {}, noop, "r1");
        result = routeTable.getVirtualPathData({ a: 1, b: 2, c: "3" });
        strictEqual(result.virtualPath, "abc/2/3?a=1");

        routeTable.clear();
        strictEqual(routeTable.length(), 0);
    });

    test("Route table can ignore", function() {
        var result,
            count = 0;

        strictEqual(routeTable.length(), 0);

        routeTable.ignore("a/b/{x}", { x: "[0-9]+" });
        strictEqual(routeTable.length(), 1);

        routeTable.push(new Route("{a}/{b}/{c}", {}, {}, {}, function() {
            ++count;
        }), "r1");
        strictEqual(routeTable.length(), 2);

        result = routeTable.getRouteData("a/b/1");
        result.routeHandler();
        strictEqual(count, 0);
        deepEqual(result.values, { x: "1" });

        result = routeTable.getRouteData("a/b/11");
        result.routeHandler();
        strictEqual(count, 0);
        deepEqual(result.values, { x: "11" });

        result = routeTable.getRouteData("a/b/a1");
        result.routeHandler();
        strictEqual(count, 1);
        deepEqual(result.values, { a: "a", b: "b", c: "a1" });

        routeTable.clear();
        strictEqual(routeTable.length(), 0);
    });
}(this.window, !this.window && require, this.jsMVC || jsMVC));
