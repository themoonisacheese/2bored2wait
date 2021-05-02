"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = __importDefault(require("child_process"));
const fs_1 = __importDefault(require("fs"));
function runScript(scriptPath, callback) {
    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;
    // basic config to join a test server
    let config = JSON.parse(fs_1.default
        .readFileSync('./config/docker.json', 'utf-8')
        .replace(/\/\/.*?\n/g, '')
        .replace(/"DISCORDBOT_FLAG"/, "false")
        .replace(/"WEBSERVER_FLAG"/, "true")
        .replace(/"MINECRAFT_PROXY_PORT"/, "25565")
        .replace(/"WEB_UI_PORT"/, "9080"));
    config.joinOnStart = true;
    config.minecraftserver.hostname = 'twerion.net'; // a random server which allows cracked accounts to join
    config.minecraftserver.onlinemode = false;
    config.minecraftserver.is2b2t = false;
    fs_1.default.writeFileSync('./config/test.json', JSON.stringify(config));
    var process = child_process_1.default.fork('./lib/main.js', { env: { test: 'true' } });
    // listen for errors as they may prevent the exit event from firing
    process.once('error', (err) => {
        if (invoked)
            return;
        invoked = true;
        callback(err);
    });
    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked)
            return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });
    setTimeout(function () {
        process.kill();
    }, 10000);
}
// Now we can run a script and invoke a callback when complete, e.g.
runScript('./test/some-script.js', function (err) {
    if (err && !String(err).includes('Error: exit code null'))
        throw err; // check if the error is caused by killing the process
    console.log('Test successful');
});
