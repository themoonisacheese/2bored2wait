const fs = require('node:fs');
const os = require('node:os')
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


// constants
const conVer = "1.0.0"

const UPDATE_PROMPT = `To ignore press enter.
To clear your settings type 'settings'.
To open the release in browser, type 'show'.
> `;
const DEFAULT_CONFIG = `{
    "version": "${conVer}",
    "accountType": "mojang", // set this to microsoft if you want to use a microsoft account
    "discordBot": true,
    "dc_chat": true, // Can be disabled to stop the discord bot from speaking
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
        "port": 25565,
        "version": "1.12.2",
        "onlinemode": true,
        "username": "lol" // the username to use if onlinemode is false
    },
    "desktopNotifications": { // sends a desktop notification if the place in the queue reaches the specified number
        "enabled": true,
        "threshold": 20
    },
    "notification": { // sends a message via discord if the place in the queue reaches the specified number
        "enabled": false, // you must send the bot a message once.
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
    "expandQueueData": false, // enlarge the dataset in queue.json for better ETA calculation
    "displayEmail": false, // If set to true, the cli and discord will disply your email instead of your username
    "favicon": "" //convert a png icon to base64 for your server icon!
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
        fs.mkdirSync(proper_dir, { recursive: true });
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

    let { tag_name, html_url, body } = JSON.parse(await latest.text());

    if (`v${require("./package.json").version}` == tag_name) {
        start();
        return;
    }
    let update_message = newUpdateMessage(tag_name, body);

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
                fs.writeFileSync(path.join(config_dir, "local.json"), DEFAULT_CONFIG);
                process.exit(0);
            case 'dl':
            case 'download':
            case 'show':
                require('open')(html_url);
                console.log(html_url)
                process.exit(0);
            default:
                console.log("Invalid response.");
                question();
                break;
        }
    };
})()

// functions

function start() {
    if (config.version === conVer) {
        console.log("Please wait...");
        rl.close();
        require('./main.js');
    } else {
        console.log("It appears your default.json is outdated! Should I update it? (This wil cause anything you have changed in default.json to disappear! Instead make changes to local.json if you want to keep them!)")

        rl.question("Overwrite? [yes]/no: ", function (answer) {
            if (answer === 'yes') {
                console.log("Updating the configs")
                const config_dir = process.env["NODE_CONFIG_DIR"];
                const path = require('path');
                const defaultOld = path.join(config_dir, 'default.json');
                fs.renameSync(defaultOld, `${defaultOld}.bak`);
                fs.writeFileSync(path.join(config_dir, "default.json"), DEFAULT_CONFIG);
                console.log('Done Updating the config! Please Run 2bored2wait (Press any key to exit!)');
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.on('data', process.exit.bind(process, 0));	
            } else if (answer === 'no') {
                console.log("Alright! You may have problems if it isn't updated!")
                console.log("Please wait...");
                rl.close();
                require('./main.js');
            }
        })
    }
}


function newUpdateMessage(tag, body) {
    return require('boxen')(`New Update Available! → ${tag}
 
Changes:
${body}

Change Log: https://github.com/themoonisacheese/2bored2wait/compare/v${require("./package.json").version}...${tag}`, {
        padding: 1,
        margin: 2,
        align: 'center',
        borderColor: 'red',
        float: 'center',
        borderStyle: 'round'
    })
};
