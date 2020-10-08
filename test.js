
var childProcess = require('child_process');
const fs = require("fs");
const jsonminify = require("node-json-minify");

function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;
	let config = fs.readFileSync("./config.json.example", "utf-8");
	config = config.replace("DISCORDBOT_FLAG", "true");
	config = config.replace("WEBSERVER_FLAG", "true");
	config = config.replace("MINECRAFT_PROXY_PORT", "25565");
	config = config.replace("WEB_UI_PORT", "9080");
	config = JSON.parse(jsonminify(config));
	fs.writeFileSync("./config.json", JSON.stringify(config));
    var process = childProcess.fork("./main.js");

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

}

// Now we can run a script and invoke a callback when complete, e.g.
runScript('./some-script.js', function (err) {
    if (err) throw err;
    console.log('Test successful');
});
