(function (global, undefined) {
    "use strict";

    // Imports.
    var errors = [],
        logs = [],
        error = console ? function (message) {
            if (jsMVC.debug) {
                console.error(new Date() + " " + message);
            }
        } : function (message) {
            if (jsMVC.debug) {
                errors.push(new Date() + " " + message);
            }
        },
        log = console ? function (message) {
            if (jsMVC.debug) {
                console.log(new Date() + " " + message);
            }
        } : function (message) {
            if (jsMVC.debug) {
                logs.push(new Date() + " " + message);
            }
        };

    jsMVC.debug = false;
    jsMVC.errors = errors;
    jsMVC.logs = logs;
    jsMVC.error = error;
    jsMVC.log = log;

    jsMVC.noop = function () {
    };
}(this));
