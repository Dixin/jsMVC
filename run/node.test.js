(function() {
    var build = require("../build/build.node.js"),
        files = build.source.map(function(file) {
            return "../tests/" + file.replace(".js", ".tests.js");
        }),
        qunit = require("../tools/node_modules/qunit"),
        test = function(path) {
            qunit.run({
                code: {
                    path: path,
                    namespace: "jsMVC"
                },
                tests: files
            }, function(error) {
                if (error) {
                    console.log(error);
                }
            });
        };

    exports.build = build.build;
    exports.min = build.min;
    exports.test = test;
}())
