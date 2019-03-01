//this module exposes functions and variables to control the HTTP server.
var http = require('http');
var fs = require('fs');

module.exports = {
    createServer : function(port) {
        http.createServer(function(req, res){
            if (req.url == "/index.html") {
                res.writeHead(200, {'Content-type': 'text/html'});
                res.write(fs.readFileSync('index.html'));
                res.end();
            }else{
                res.writeHead(404);
                res.end();
            }
        }).listen(port);
    },
    queuePlace : "None",
    ETA: "None"
};