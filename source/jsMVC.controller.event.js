/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.routing.js"/>
/// <reference path="jsMVC.routing.browser.js"/>
/// <reference path="jsMVC.routing.node.js"/>
/// <reference path="jsMVC.controller.js"/>

(function (browser, node, jsMVC, undefined) {
    "use strict";

    var _ = jsMVC._,
        noop = _.noop,
        EmptyResult = (function () {
            var constructor = function () {
            };

            constructor.prototype = {
                constructor: constructor,
                execute: noop
            };
            return constructor;
        }());

    jsMVC.event.EmptyResult = function () {
        return new EmptyResult();
    };

}(this.window, !this.window && require, this.jsMVC || exports));
