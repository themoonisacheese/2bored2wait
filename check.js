const fs = require('node:fs');
const os = require('node:os')
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


// constants

const UPDATE_PROMPT = `To ignore press enter.
To clear your settings type 'settings'.
To open the release in browser, type 'show'.
> `;
const DEFAULT_CONFIG = `{
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
}`;

if (process.env["NODE_CONFIG_DIR"] ?? "" == "") {
    let proper_dir = require('@folder/xdg')({ "subdir": "2bored2wait" }).config;
    const fs = require('fs');
    let dirs = [
        "config", 
        `${os.homedir()}/.2bored2wait/config`, 
        `${os.homedir()}/.2bored2wait`, 
        proper_dir
    ];

    outer: while (true) {
        for (const dir of dirs) {
            if (fs.existsSync(dir)) {
                process.env["NODE_CONFIG_DIR"] = dir;
                break outer;
            }
        }
        fs.mkdirSync(proper_dir);
        process.env["NODE_CONFIG_DIR"] = proper_dir;
        fs.writeFileSync(require('path').join(proper_dir, "default.json"), DEFAULT_CONFIG);
        break outer;
    }
}

let config = require('config');

if (config.updatemessage === false || config.updatemessage == "n") {
    start();
    process.exit(0);
}

(async () => {
    const fetch = require('node-fetch');
    let latest = await fetch('https://api.github.com/repos/themoonisacheese/2bored2wait/releases/latest');

    let { tag_name, url } = JSON.parse(await latest.text());

    let isLatest = require("./package.json").version.includes(tag_name);

    if (isLatest) {
        start();
        return;
    }
    let update_message = newUpdateMessage(tag_name);

    question();

    function question() {
        console.log(update_message);
        rl.question(UPDATE_PROMPT, choiceHandler);
    }

    function choiceHandler(choice) {
        switch (choice.toLowerCase()) {
            case '':
                start();
                break;
            case 'settings':
                console.log("Clearing Settings");
                const config_dir = process.env["NODE_CONFIG_DIR"];
                const path = require('path');
                for (const file of fs.readdirSync(config_dir)) {// require was missing fuck
                    const full_path = path.join(config_dir, file);
                    fs.renameSync(full_path, `${full_path}.bak`);
                }
                fs.writeFileSync(path.join(config_dir, "default.json"), DEFAULT_CONFIG);
                process.exit(0);
                break;
            case 'dl':
            case 'download':
            case 'show':
                require('open')(url);
                process.exit(0);
                break;
            default:
                console.log("Invalid response.");
                question();
                break;
        }
    };
})()

// functions

function start() {
    console.log("Please wait...");
    rl.close();
    require('./main.js');
}

function newUpdateMessage(tag) {
    return require('boxen')('New Update Available! → ' + tag, {
        padding: 1,
        margin: 1,
        align: 'center',
        borderColor: 'red',
        float: 'center',
        borderStyle: 'round'
    })
};