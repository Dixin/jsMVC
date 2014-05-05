/// <reference path="../source/_references.js"/>
/// <reference path="../tools/_references.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    jsMVC.config();

    QUnit.module("jsMVC");

    test("Can export jsMVC", function () {
        ok(jsMVC);
        strictEqual(jsMVC.version, 0.8);
        strictEqual(typeof jsMVC.noConflict, "function");
    });

    test("Can resolve conflict", function () {
        strictEqual(jsMVC.noConflict(), jsMVC);
        ok(jsMVC);
        if (browser) {
            strictEqual(browser.jsMVC, undefined);
        }
    });

}(this.window, !this.window && require, this.jsMVC /* browser */ || jsMVC /* node.js, a variable added by qunit */));
