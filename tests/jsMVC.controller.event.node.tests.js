/// <reference path="../tools/_references.js"/>
/// <reference path="../source/_references.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    if (browser) {
        // Not in node.js.
        return;
    }

    QUnit.module("jsMVC.controller.event.node");


}(this.window, !this.window && require, this.jsMVC || jsMVC));
