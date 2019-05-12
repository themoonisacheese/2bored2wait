//this module exposes functions and variables to control the HTTP server.
const http = require('http'); //to serve the pages
const fs = require('fs'); //to read the webpages from disk

module.exports = {
    createServer : function(port) {
        http.createServer(function(req, res) {
            if (req.url === "/") { //main page of the web app
                res.writeHead(200, {'Content-type': 'text/html'});
                res.write(fs.readFileSync('index.html'));
                res.end();
            } else if(req.url === "/index.css") { //css file to make it not look like too much shit
                res.writeHead(200, {'Content-type': 'text/css'});
                res.write(fs.readFileSync('index.css'));
                res.end();
            } else if(req.url === "/update") { //API endpoint to get position, ETA, and status in JSON format      
                res.writeHead(200, {'Content-type': 'text/json'});
                res.write("{\"username\": \""+ module.exports.username +"\",\"place\": \""+ module.exports.queuePlace +"\",\"ETA\": \""+ module.exports.ETA +"\", \"inQueue\": " + module.exports.isInQueue+"}")
                res.end();
            } else if(req.url === "/start") { //API endpoint to start queuing
                res.writeHead(200);
                res.end();
                module.exports.onstartcallback();
            } else if(req.url === "/stop") { //API endpoint to stop queuing
                res.writeHead(200);
                res.end();
                module.exports.onstopcallback();
            } else {
                res.writeHead(404);
                res.end();
            }
        }).listen(port);
    },
    onstart:function(callback) { //function to set the action to do when starting
        console.log('Webserver is online');
        module.exports.onstartcallback = callback;
    },
    onstop:function(callback) { //same but to stop
        console.log('Webserver is offline');
        module.exports.onstopcallback = callback;
    },
    queuePlace : "None", //our place in queue
    ETA: "None", //ETA
    isInQueue: false, //are we in queue?
    onstartcallback: null, //a save of the action to start
    onstopcallback: null //same but to stop
};

