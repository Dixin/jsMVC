/// <reference path="../source/_references.js"/>
/// <reference path="../tools/_references.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";

    QUnit.module("jsMVC.event");

    test("Can add and trigger and remove event", function() {
        var result1 = null,
            result2 = null,
            eventType = "eventType",
            callback1 = function(event) {
                result1 = event;
            },
            callback2 = function(event) {
                result2 = event;
            };
        
        jsMVC.on(eventType, callback1);

        jsMVC._.trigger(eventType, 1);
        strictEqual(result1, 1);
        
        jsMVC.on(eventType, callback2);
        jsMVC._.trigger(eventType, 2);
        strictEqual(result1, 2);
        strictEqual(result2, 2);
        
        jsMVC.off(eventType, callback1);
        jsMVC._.trigger(eventType, 3);
        strictEqual(result1, 2);
        strictEqual(result2, 3);
        
        jsMVC.off(eventType, callback2);
        jsMVC._.trigger(eventType, 4);
        strictEqual(result1, 2);
        strictEqual(result2, 3);
    });
    
    test("Can add and trigger and remove all event", function() {
        var result1 = null,
            result2 = null,
            eventType = "eventType",
            callback1 = function(event) {
                result1 = event;
            },
            callback2 = function(event) {
                result2 = event;
            };

        jsMVC.on(eventType, callback1);

        jsMVC._.trigger(eventType, 1);
        strictEqual(result1, 1);

        jsMVC.on(eventType, callback2);
        jsMVC._.trigger(eventType, 2);
        strictEqual(result1, 2);
        strictEqual(result2, 2);

        jsMVC.off(eventType);
        jsMVC._.trigger(eventType, 3);
        strictEqual(result1, 2);
        strictEqual(result2, 2);
    });

}(this.window, !this.window && require, this.jsMVC || jsMVC));
