const http = require('http');
const fs = require('fs');
const { EventEmitter } = require('events');

class WebServer extends EventEmitter {
    constructor(port, address) {
        super();
        this.server = http.createServer((req, res) => {
            const auth = !this.password || this.password === req.headers.xpassword;
            switch (req.url) {
                case "/":
                    res.writeHead(200, { 'Content-type': 'text/html' });
                    res.end(fs.readFileSync('webserver/index.html'));
                    break;
                case "/index.css":
                    res.writeHead(200, { 'Content-type': 'text/css' });
                    res.end(fs.readFileSync('webserver/index.css'));
                    break;
                case "/update":
                    if (auth) {
                        res.writeHead(200, { 'Content-type': 'text/json' });
                        res.end(JSON.stringify(this.state));
                    } else {
                        res.writeHead(403);
                        res.end();
                    }
                case "/start":
                case "/stop":
                case "/togglerestart":
                    if (auth) {
                        this.emit(req.url.slice(1));
                        res.writeHead(200);
                        res.end();
                    } else {
                        res.writeHead(403);
                        res.end();
                    }
                default:
                    res.writeHead(404);
                    res.end();
            }
        }).listen(port, address);
    }
}

module.exports = { WebServer };
