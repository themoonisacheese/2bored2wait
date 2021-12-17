let parser = new(require('rss-parser'))();
const fs = require('fs');
const boxen = require('boxen');
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var pjson = require('./package.json');
var cv1 = pjson.version;
var cv = 'v' + cv1;

try {
    config = require("config");
} catch (err) {
    if (String(err).includes("SyntaxError: ")) {
        console.error("The syntax in your config file is not correct. Make sure you replaced all values as the README says under 'How to Install' step 5. If it still does not work, check that all quotes are closed. You can look up the json syntax online. Please note that the comments are no problem although comments are normally not allowed in json. " + err)
        process.exit(1);
    }
}
check();

function check() {

    var updatemessage = config.updatemessage;
    (async () => {
        let feed = await parser.parseURL('https://github.com/themoonisacheese/2bored2wait/releases.atom');
        feed.items.every(item => {
            var lv = (item.title);
            if (!cv.includes(lv) && updatemessage != "n") {
                console.log(boxen('New Update Available! → ' + lv, {
                    padding: 1,
                    margin: 1,
                    align: 'center',
                    borderColor: 'red',
                    float: 'center',
                    borderStyle: 'round'
                }));
                rl.question("To continue type 1. To edit settings type 2. ", function(choice) {
                    if (choice == 1) {
                        start();
                    } else if (choice == 2) {
                        settings();
                    } else {
                        console.log("Invalid response.");
                        check();
                    };
                });
            } else {
                start();
            };
        });
    })();

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

            console.log("Done.");

        });
        start();
    }
}