/// <reference path="../tools/_references.js"/>
/// <reference path="../source/_references.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";

    QUnit.module("jsMVC.ready");

    test("Can call ready multiple times", function() {
        var result = false,
            callback = function() {
                result = true;
            };

        jsMVC.ready(callback);
        strictEqual(result, false);
    });

}(this.window, !this.window && require, this.jsMVC || jsMVC));
