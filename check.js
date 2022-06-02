let parser = new(require('rss-parser'))();
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const boxen = require('boxen');
const readline = require("readline");
// This dummy var is a workaround to allow binaries
const dummy = path.join(__dirname, '../config/default.json')
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
        process.exit(1);
    }
}

// start the checks
getconf();

function getconf() {
    const conf = "./config/default.json";
    if (fs.existsSync(conf)) {
        check();
    } else {
        console.log("Default conf doesn't exist, downloading...");
        const url = 'https://raw.githubusercontent.com/themoonisacheese/2bored2wait/master/config/default.json';

        https.get(url, (res) => {
            // Image will be stored at this path
            fs.mkdirSync("config");
            const path = `${__dirname}/config/default.json`;
            const filePath = fs.createWriteStream(path);
            res.pipe(filePath);
            filePath.on('finish', () => {
                filePath.close();
                console.log('Default Config Downloaded! Please rerun 2bored2wait.');
                console.log('Press any key to exit');

                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.on('data', process.exit.bind(process, 0));

            })
        })
    }
}


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
