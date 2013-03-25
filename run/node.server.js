(function() {
    var jsMVC = require("../build/jsMVC.js");
    
    jsMVC.config("../run/node.config.js").ready(function(server) {
        server.listen(process.env.PORT || 8000, process.env.IP); // Cloud9 uses process.env.PORT and process.env.IP.
    });
}());
