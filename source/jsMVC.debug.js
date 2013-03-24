// jsMVC JavaScript library
// http://jsMVC.net
//
// v0.8 preview
// Jan 14 2013 GMT-08
//
// Copyright 2013 Dixin http://weblogs.asp.net/dixin
// Released under the MIT license

(function(global, undefined) {
    "use strict";

    // Imports.
    var errors = [],
        logs = [],
        error = console ? function(message) {
            if (jsMVC.debug) {
                console.error(new Date() + " " + message);
            }
        } : function(message) {
            if (jsMVC.debug) {
                errors.push(new Date() + " " + message);
            }
        },
        log = console ? function(message) {
            if (jsMVC.debug) {
                console.log(new Date() + " " + message);
            }
        } : function(message) {
            if (jsMVC.debug) {
                logs.push(new Date() + " " + message);
            }
        };

    jsMVC.debug = false;
    jsMVC.errors = errors;
    jsMVC.logs = logs;
    jsMVC.error = error;
    jsMVC.log = log;

    jsMVC.noop = function() {
    };
}(this));
