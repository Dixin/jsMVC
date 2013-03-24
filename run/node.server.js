(function() {
    var jsMVC = require("../build/jsMVC.js");
    
    jsMVC.config("../run/node.config.js").ready(function(server) {
        server.listen(8000);
    });
    
}());
