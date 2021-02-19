var childProcess = require('child_process');
const fs = require("fs");
const jsonminify = require("node-json-minify");
const mc = require("minecraft-protocol");
const crypto = require("crypto");

function runScript(scriptPath, callback) {

	// keep track of whether callback has been invoked to prevent multiple invocations
	var invoked = false;
	// basic config to join a test server
	let config = fs.readFileSync("./config.json.example", "utf-8");
	config = config.replace("DISCORDBOT_FLAG", "true");
	config = config.replace("WEBSERVER_FLAG", "true");
	config = config.replace("MINECRAFT_PROXY_PORT", "25565");
	config = config.replace("WEB_UI_PORT", "9080");
	config = JSON.parse(jsonminify(config));
	config.joinOnStart = true;
	config.minecraftserver.hostname = "twerion.net"; // a random server which allows cracked accounts to join
	config.minecraftserver.onlinemode = false;
	config.minecraftserver.is2b2t = false;
	config.minecraftserver.username = crypto.randomBytes(10).toString("hex");
	fs.writeFileSync("./config.json", JSON.stringify(config));
	var process = childProcess.fork("./main.js");
	// connect with a test client to 2b2w
	setTimeout(function () {
		let client = mc.createClient({port: config.ports.minecraft, username: config.minecraftserver.username, version: config.minecraftserver.version});
		client.on("error", (err) => {
			throw err;
		});
	}, 7000);
	
	// listen for errors as they may prevent the exit event from firing
	process.on('error', function (err) {
		if (invoked) return;
		invoked = true;
		callback(err);
	});

	// execute the callback once the process has finished running
	process.on('exit', function (code) {
		if (invoked) return;
		invoked = true;
		var err = code === 0 ? null : new Error('exit code ' + code);
		callback(err);
	});
	setTimeout(function () {
		process.kill();
	}, 10000);

}

// Now we can run a script and invoke a callback when complete, e.g.
runScript('./some-script.js', function (err) {
	if (err && !String(err).includes("Error: exit code null")) throw err; // check if the error is caused by killing the process
	console.log('Test successful');
});
