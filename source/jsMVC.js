// jsMVC JavaScript library implements routing and MVC for browser (single page application) and server side (nodejs) development.
// http://jsMVC.net
//
// v0.8 preview
// Jan 14 2013 GMT-08
//
// Copyright (C) 2013 - 2014 Dixin Yan http://weblogs.asp.net/dixin
// Released under the MIT license

(function (browser, node, undefined) {
    "use strict";

    // Imports.
    var nativeSilce = Array.prototype.slice,
        previous = browser && browser.jsMVC,
        jQuery = browser && browser.jQuery,
        // Local variables.
        jsMVC = function (options) {
            return jsMVC.config(options);
        };

    jsMVC.version = 0.8;

    jsMVC.noConflict = function () {
        if (browser && browser.jsMVC === jsMVC) {
            // Old value of window.jsMVC is saved. Calling noConflict() restores it.
            browser.jsMVC = previous;
        }
        return jsMVC;
    };

    // Define AMD module. http://requirejs.org/docs/whyamd.html
    if (typeof define === "function" && define.amd) {
        define("jsMVC", [], function () {
            return jsMVC;
        });
    }

    // Define jQuery plugin. http://docs.jquery.com/Plugins/Authoring#Namespacing
    if (jQuery) {
        // jQuery.namespace(method, args), not jQuery.namespace.method(args).
        jQuery.jsMVC = function (name) {
            var prop = jsMVC[name];
            if (prop) {
                return prop.apply(undefined, nativeSilce.call(arguments, 1));
            }
            return undefined;
        };
    }

    // Export to browser window.
    if (browser) {
        browser.jsMVC = jsMVC;
    }

    // Export to node.js. function (exports, require, module, __filename, __dirname) { }
    if (node) {
        exports = jsMVC;
        if (typeof module !== "undefined" && module.exports) {
            module.exports = jsMVC;
        }
    }
}(this.window, !this.window && require));
