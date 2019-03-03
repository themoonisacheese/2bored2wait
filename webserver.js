//this module exposes functions and variables to control the HTTP server.
var http = require('http');
var fs = require('fs');

module.exports = {
    createServer : function(port) {
        http.createServer(function(req, res){
            if (req.url == "/index.html" || req.url == "/") {
                res.writeHead(200, {'Content-type': 'text/html'});
                res.write(fs.readFileSync('index.html'));
                res.end();
            }else if(req.url == "/index.css"){
                res.writeHead(200, {'Content-type': 'text/css'});
                res.write(fs.readFileSync('index.css'));
                res.end();
            }else if(req.url == "/update"){                
                res.writeHead(200, {'Content-type': 'text/json'});
                res.write("{\"username\": \""+ module.exports.username +"\",\"place\": \""+ module.exports.queuePlace +"\",\"ETA\": \""+ module.exports.ETA +"\", \"inQueue\": " + module.exports.isInQueue+"}")
                res.end();
            }else if(req.url == "/start"){
                res.writeHead(200);
                res.end();
                module.exports.onstartcallback();
            }else if(req.url == "/stop"){
                res.writeHead(200);
                res.end();
                module.exports.onstopcallback();
            }else{
                res.writeHead(404);
                res.end();
            }
        }).listen(port);
    },
    onstart:function(callback){
        module.exports.onstartcallback = callback;
    },
    onstop:function(callback) {
        module.exports.onstopcallback = callback;
    },
    queuePlace : "None",
    ETA: "None",
    username: "ERROR",
    isInQueue: false,
    onstartcallback: null,
    onstopcallback: null
};

