var childProcess = require('child_process');
const util = require("./util");

function runScript(scriptPath, callback) {

	// keep track of whether callback has been invoked to prevent multiple invocations
	var invoked = false;
	// basic config to join a test server
	let config = util.readJSON("config/default.json");
	config.discordBot = false;
	config.joinOnStart = true;
	config.minecraftserver.hostname = "twerion.net"; // a random server which allows cracked accounts to join
	config.minecraftserver.onlinemode = false;
	config.minecraftserver.is2b2t = false;
	config.ports.minecraft = 52157 // use uncommon ports to avoid listen on an already used port
	config.ports.web = 52156
	process.env.NODE_CONFIG = JSON.stringify(config);
	let mainProcess = childProcess.fork(scriptPath);

	// listen for errors as they may prevent the exit event from firing
	mainProcess.on('error', function (err) {
		if (invoked) return;
		invoked = true;
		callback(err);
	});

	// execute the callback once the process has finished running
	mainProcess.on('exit', function (code) {
		if (invoked) return;
		invoked = true;
		var err = code === 0 ? null : new Error('exit code ' + code);
		callback(err);
	});
	setTimeout(function () {
		mainProcess.kill();
	}, 10000);

}

// Now we can run a script and invoke a callback when complete, e.g.
runScript('./main.js', function (err) {
	if (err && !String(err).includes("Error: exit code null")) throw err; // check if the error is caused by killing the process
	console.log('Test successful');
});
