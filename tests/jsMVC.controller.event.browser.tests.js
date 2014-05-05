/// <reference path="../tools/_references.js"/>
/// <reference path="../source/_references.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    if (!browser) {
        // Not in browser.
        return;
    }

    QUnit.module("jsMVC.controller.event.browser");

}(this.window, !this.window && require, this.jsMVC || jsMVC));
