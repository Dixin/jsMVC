/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.routing.js"/>
/// <reference path="jsMVC.routing.browser.js"/>
/// <reference path="jsMVC.routing.node.js"/>
/// <reference path="jsMVC.controller.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";
    
    if (!browser) {
        return;
    }

}(this.window, !this.window && require, this.jsMVC || exports));
