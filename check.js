let parser = new(require('rss-parser'))();
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const boxen = require('boxen');
const readline = require("readline");
const path = require('path');
const os = require("os");
process.env.NODE_CONFIG_DIR = `${os.homedir()}/.config/2bored2wait`;
// This dummy var is a workaround to allow binaries
const dummy = path.join(__dirname, './default.json')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var pjson = require('./package.json');
var cv1 = pjson.version;
var cv = 'v' + cv1;

try {
    config = require("config/parser");
    config.mergeDeep(config, DEFAULT)

} catch (err) {
    if (String(err).includes("SyntaxError: ")) {
        console.error("The syntax in your config file is not correct. Make sure you replaced all values as the README says under 'How to Install' step 5. If it still does not work, check that all quotes are closed. You can look up the json syntax online. Please note that the comments are no problem although comments are normally not allowed in json. " + err)
        process.exit(1);
    }
}

const configPath = path.join(process.cwd(), './default.json');

// start the checks
getconf();

function getconf() {

    // if (fs.existsSync(configPath)) {
    //     check();
    // } else {
    try {
        console.log("Default conf doesn't exist, downloading...");

        let data = `{
            "accountType": "mojang", // set this to microsoft if you want to use a microsoft account
            "discordBot": true,
            "webserver": true,
            "ports": {
                "minecraft": 25565, // port for the proxy server
                "web": 8080
            },
            "address":{ // address 2b2w listens on. if you leave it on 0.0.0.0 you can via all IPs
                "minecraft": "0.0.0.0",
                "web": "0.0.0.0"
            },
            "openBrowserOnStart": false,
            "password": "", // password for the webinterface
            "MCversion": "1.12.2",
            "logging": true, // log errors and queue place
            "reconnect": {
                "onError": true, // reconnect on error or if 2b2t kicks you
                "notConnectedQueueEnd": false // restart the queue if you are not connect at the end of it
            },
            "minecraftserver": { // the server you want to connect. Make not much sense to change it, was just added for development purpose
                "hostname": "2b2t.org",
                "is2b2t": true, // to allow proxies inbetween 2bored2wait and 2b2t
                "port": 25565,
                "version": "1.12.2",
                "onlinemode": true,
                "username": "lol" // the username to use if onlinemode is false
            },
            "notification": { // sends a message via discord if the place in the queue reaches the specified number
                "enabled": true, // you must send the bot a message once.
                "queuePlace": 20
            },
            "antiAntiAFK": { 
                "enabled": false, // master switch for all bypass antiAFK plugins
                "config": {  // mineflayer-antiafk config
                }
            },
            "userStatus": true, // show username in discord bot status, in case of alts
            "joinOnStart": false, // join the server when 2b2w is started
            "whitelist": false, // only let the same minecraft account join 2b2w as the one connected to 2b2t
            "expandQueueData": false // enlarge the dataset in queue.json for better ETA calculation
        }`



        fs.open(configPath, 'r', function (err, fd) {
            if (err) {
                fs.writeFile(`${configPath}`, data, (err) => {

                    // In case of a error throw err.
                    if (err) throw err;
                })
                console.log("Config made, please rerun 2bored2wait!")
                console.log('Press any key to exit');

                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.on('data', process.exit.bind(process, 0));
            } else {
                console.log("Config Already Made, proceeding...");
                console.log("Done")
                check();
            }
        });   
    } catch (err) {
        if (String(err).includes("SyntaxError: ")) {
            process.exit(1);
        }
    }
    // }
}


function start() {
    console.log("Please wait...");
    rl.close();
    require('./main.js');
}

if (config.updatemessage === false || config.updatemessage == "n") {
    start();
    process.exit(0);
}

function check() {
(async () => {
    let latest = await require("node-fetch")('https://api.github.com/repos/themoonisacheese/2bored2wait/releases/latest');

    let { tag_name, url } = JSON.parse(await latest.text());

    let isLatest = require("./package.json").version.includes(tag_name);

    if (isLatest) {
        start()
    } else {
        let newUpdateMessage = boxen('New Update Available! → ' + tag_name, {
            padding: 1,
            margin: 1,
            align: 'center',
            borderColor: 'red',
            float: 'center',
            borderStyle: 'round'
        });
        console.log(newUpdateMessage)
        rl.question("To continue type 1. To edit settings type 2. ", function (choice) {
            if (choice == 1) {
                start();
            } else if (choice == 2) {
                settings();
            } else {
                console.log("Invalid response.");
                check();
            };
        });
    }
})()

function start() {
    console.log("Please wait...");
    rl.close();
    require('./main.js');
}

function settings() {
    console.log("Clearing Settings");
    fs.unlink('config/local.json', (err) => {
        if (err) {
            console.log("No settings file.");
        }

        console.log("Done. Run 2bored2wait again!");

    });
    start();
}
}