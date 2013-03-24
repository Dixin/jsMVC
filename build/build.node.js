(function() {
    var sourceFolder = "../source/",
        buildFolder = "../build/",
        list = "_references.js",
        buildFile = "jsMVC.js",
        minFile = "jsMVC.min.js",
        mapFile = "jsMVC.min.js.map",
        lineBreak = "\r\n",
        fs = require('fs'),
        read = function(path) {
            return fs.readFileSync(path).toString().replace(/^\xef\xbb\xbf/, ""); // Remove BOM.
        },
        write = fs.writeFileSync,
        uglify = require("../tools/node_modules/uglify-js"), // https://github.com/mishoo/UglifyJS2
        minify = function(code) {
            return uglify.minify(code, {
                fromString: true,
                outSourceMap: mapFile,
                warnings: true
            });
        },
        log = console.log,
        files = read(sourceFolder + list).replace(/^\s+|\s+$/g, "").split("\n").map(function(file) {
            return file.replace(/^[\w\W]+\"(.*)\"[\w\W]+$/, "$1");
        }),
        build = files.map(function(file) {
            file = sourceFolder + file;
            log("Reading '" + file + "'.");
            file = read(file).replace(/\s+$/g, "");
            log("Read " + file.length + " characters.");
            return file;
        }).join(lineBreak + lineBreak) + lineBreak,
        result = minify(build);

    // Write jsMVC.js.
    log("Writing '" + buildFile + "'.");
    write(buildFolder + buildFile, build);
    log("Wrote " + build.length + " characters.");

    // Write jsMVC.min.js.
    log("Writing '" + minFile + "'.");
    write(buildFolder + minFile, result.code);
    log("Wrote " + result.code.length + " characters.");

    // Write jsMVC.min.js.map.
    log("Writing '" + mapFile + "'.");
    write(buildFolder + mapFile, result.map);
    log("Wrote " + result.map.length + " characters.");

    exports.source = files;
    exports.build = buildFolder + buildFile;
    exports.min = buildFolder + minFile;
    exports.map = buildFolder + mapFile;
}());
