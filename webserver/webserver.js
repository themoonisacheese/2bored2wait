//this module exposes functions and variables to control the HTTP server.
const http = require('http'); //to serve the pages
const fs = require('fs'); //to read the webpages from disk

module.exports = {
	createServer : (port, address) => {
		http.createServer((req, res) => {
			if (queuePlace == 'undefined') {
				var queuePlace = "None"
			}        
			if (req.url === "/") { //main page of the web app
				res.writeHead(200, {'Content-type': 'text/html'});
				res.write(fs.readFileSync('webserver/index.html'));
				res.end();
			} else if(req.url === "/index.css") { //css file to make it not look like too much shit
				res.writeHead(200, {'Content-type': 'text/css'});
				res.write(fs.readFileSync('webserver/index.css'));
				res.end();
			} else if(req.url === "/particles.js") { 
				res.writeHead(200, {'Content-type': 'text/javascript'});
				res.write(fs.readFileSync('node_modules/particles.js/particles.js'));
				res.end();
			} else if(req.url === "/app.js") { 
				res.writeHead(200, {'Content-type': 'text/javascript'});
				res.write(fs.readFileSync('node_modules/particles.js/demo/js/app.js'));
				res.end();
				res.end();
			} else if (module.exports.password == "" || req.headers.xpassword == module.exports.password) { //before doing any action, test if the provided password is correct.
				if(req.url === "/update") { //API endpoint to get position, ETA, and status in JSON format      
					res.writeHead(200, {'Content-type': 'text/json'});
					let json = module.exports;
					json.place = json.queuePlace;
					res.write(JSON.stringify(json));
					res.end();
				} else if(req.url === "/start") { //API endpoint to start queuing
					res.writeHead(200);
					res.end();
					module.exports.onstartcallback();
				} else if(req.url === "/stop") { //API endpoint to stop queuing
					res.writeHead(200);
					res.end();
					module.exports.onstopcallback();
				} else if(req.url === "/togglerestart"){
					module.exports.restartQueue = !module.exports.restartQueue
				} else {
					res.writeHead(404);
					res.end();
				}
			}else{
				res.writeHead(403);
				res.end()
			}
		}).listen(port, address);
	},
	onstart: (callback) => { //function to set the action to do when starting
		module.exports.onstartcallback = callback;
	},
	onstop: (callback) => { //same but to stop
		module.exports.onstopcallback = callback;
	},
	ETA: "None", //ETA
	queuePlace : "None", //our place in queue
	finTime: "Never", //time queueing will finish
	isInQueue: false, //are we in queue?
	onstartcallback: null, //a save of the action to start
	onstopcallback: null, //same but to stop
	restartQueue: false, //when at the end of the queue, restart if no client is connected?
	password: "" //the password to use for the webapp
};

