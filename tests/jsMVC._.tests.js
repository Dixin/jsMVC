/// <reference path="../source/_references.js"/>
/// <reference path="../tools/_references.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    QUnit.module("jsMVC._");

    var _ = jsMVC._,
        type = _.type;

    test("Can get type", function () {
        strictEqual(type(NaN), "number");
        strictEqual(type(0), "number");
        strictEqual(type(0.0), "number");
        strictEqual(type(""), "string");
        strictEqual(type(false), "boolean");
        strictEqual(type(true), "boolean");
        strictEqual(type(null), "null");
        strictEqual(type(undefined), "undefined");
        strictEqual(type({}), "object");
        strictEqual(type(browser), browser ? "object" : "undefined"); // window.
        strictEqual(type(node), node ? "function" : "boolean"); // window.
    });

}(this.window, !this.window && require, this.jsMVC || jsMVC));
