"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const open_1 = __importDefault(require("open"));
const minecraft_protocol_1 = __importDefault(require("minecraft-protocol"));
const discord_js_1 = __importDefault(require("discord.js"));
const https_1 = __importDefault(require("https"));
const mcproxy = __importStar(require("mcproxy"));
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const webserver = require('../webserver/webserver.js');
const luxon_1 = require("luxon");
//@ts-ignore
const everpolate_1 = __importDefault(require("everpolate"));
const c = 150;
let [state, starttimestring, finishtimestring] = [];
//@ts-ignore
let config = (function () {
    if (process.env['test'] === 'true')
        return JSON.parse(fs_1.default.readFileSync('config/test.json', 'utf-8'));
    try {
        //@ts-ignore
        return JSON.parse(fs_1.default.readFileSync('config/local.json', 'utf-8').replace(/\/\/.*?\n/g, ''));
    }
    catch (e) {
        if (e instanceof SyntaxError)
            console.warn(e.message);
    }
    try {
        //@ts-ignore
        return JSON.parse(fs_1.default.readFileSync('config/default.json', 'utf-8').replace(/\/\/.*?\n/g, ''));
    }
    catch (e) {
        console.error(`${e}\nPlease keep the default.json config file if you don't supply your own local.json file`);
        process.exit(1);
    }
})();
//@ts-ignore
let queueData = JSON.parse(fs_1.default.readFileSync('./config/queue.json', 'utf-8'));
let timedStart;
let dc;
let calcInterval;
let reconnectTimeout;
let reconnectTimeoutStartTime;
let conn;
let client;
let proxyClient;
let dcUser;
let server;
let finishedQueue = !config.minecraftserver.is2b2t;
let queueStartPlace;
let queueStartTime;
let stoppedByPlayer = false;
// set up actions for the webserver
webserver.restartQueue = config.reconnect.notConnectedQueueEnd;
webserver.onstart(() => {
    startQueuing();
});
webserver.onstop(() => {
    stopQueuing();
});
if (config.webserver) {
    let webPort = config.ports.web;
    webserver.createServer(webPort, config.address.web); // create the webserver
    webserver.password = config.password;
    if (config.openBrowserOnStart)
        open_1.default('http://localhost:' + webPort); //open a browser window
}
const rlIf = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function question(text) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => rlIf.question(text, resolve));
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    let askToSave = false;
    if (config.minecraftserver.onlinemode && (config.account.username === '' || config.account.password === '') && config.account.profilesFolder === '') {
        askToSave = true;
        if ((yield question('Do you want to use launcher account data? (If not, your password will be stored in plaintext if you decide to save) [y|N]: ')).toLowerCase() === 'y') {
            config.account.username = yield question('Username (NOT your email!): ');
            config.account.profilesFolder = yield question('Path to your Minecraft data folder, leave blank for the default path []:');
            config.account.profilesFolder = config.account.profilesFolder === '' ? (process.env.APPDATA ? `${process.env.APPDATA}` : process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support/minecraft` : `${process.env.HOME}/.minecraft`) : config.account.profilesFolder;
        }
        else {
            config.account.accountType = (yield question('Account type, mojang (1) or microsoft (2) [1]: ')) === '2' ? 'microsoft' : 'mojang';
            config.account.username = yield question('Email: ');
            config.account.password = yield question('Password: ');
        }
    }
    if (config.discordBot && config.BotToken === '') {
        askToSave = true;
        config.BotToken = yield question('BotToken, leave blank if not using discord []: ');
        config.discordBot = config.BotToken !== '';
    }
    if (askToSave) {
        if ((yield question('Save changes to config file for later use? [y|N]: ')).toLowerCase() === 'y')
            fs_1.default.writeFileSync('./config/local.json', JSON.stringify(config, null, 2));
        console.clear();
    }
    (() => __awaiter(void 0, void 0, void 0, function* () {
        console.log(config.discordBot);
        if (config.discordBot) {
            dc = new discord_js_1.default.Client();
            dc.login(config.BotToken);
            dc.on('ready', () => {
                var _a;
                (_a = dc === null || dc === void 0 ? void 0 : dc.user) === null || _a === void 0 ? void 0 : _a.setActivity('Queue is stopped.');
                fs_1.default.readFile('./saveid', 'utf8', (err, id) => {
                    if (!err)
                        dc === null || dc === void 0 ? void 0 : dc.users.fetch(id).then((user) => {
                            dcUser = user;
                        });
                });
            });
            dc.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                if (msg.author.username !== ((_a = dc === null || dc === void 0 ? void 0 : dc.user) === null || _a === void 0 ? void 0 : _a.username)) {
                    sendDiscordMsg(dcUser, ...(yield userInput(msg.content)));
                    if (dcUser == null || msg.author.id !== dcUser.id) {
                        fs_1.default.writeFile('./saveid', msg.author.id, function (err) {
                            if (err)
                                throw err;
                        });
                    }
                    dcUser = msg.author;
                }
            }));
            log('Started discord bot.');
        }
    }))();
    console.log(`enter commands after the $, for reference enter "help" or visit https://github.com/themoonisacheese/2bored2wait#commands`);
    if (config.joinOnStart) {
        logActivity('Starting Client');
        setTimeout(startQueuing, 1000);
    }
    else {
        console.log(`you don't have joining on start enabled, don't forget to start queuing!`);
    }
    while (true)
        console.log((yield userInput(yield question('$ ')))[1]);
}))();
function userInput(cmd) {
    return __awaiter(this, void 0, void 0, function* () {
        function getStateMessage(stopthat) {
            switch (state) {
                case 'queue':
                    if (stopthat)
                        stopQueuing();
                    return ['Queuing', webserver.queuePlace === 'None' ? `Waiting in Queue, Server hasn't sent current position yet` : `Position ${webserver.queuePlace} Estimated time until login: ${webserver.ETA}`];
                case 'timedStart':
                    if (stopthat)
                        clearTimeout(timedStart);
                    return ['Timed Start', `Starttime is set to ${starttimestring}`];
                case 'reconnect':
                    if (stopthat) {
                        stopQueuing();
                        clearTimeout(reconnectTimeout);
                    }
                    return ['Waiting to reconnect', `There was an issue connecting. Trying again in ${reconnectTimeoutStartTime.diffNow().seconds} seconds`];
                case 'auth':
                    if (stopthat)
                        stopQueuing();
                    return ['Authenticating', 'Logging in'];
                case 'calcTime':
                    if (stopthat)
                        clearTimeout(calcInterval);
                    return ['Waiting to start', `Waiting to start at the correct time, so you can play at ${starttimestring}`];
                case 'idle':
                default:
                    if (stopthat) {
                        stopQueuing();
                        return ['nothing, nothing was nunning', ''];
                    }
                    return ['Idle', 'Nothing happening rn, did you forget to start?'];
            }
        }
        switch (cmd.toLowerCase()) {
            case 'start':
                startQueuing();
                return ['Queue', 'Starting Queue'];
            case 'update':
                return getStateMessage(false);
            case 'stop':
                let stateMsg = getStateMessage(true);
                stateMsg[1] = `Stopped ${stateMsg[0]}`;
                stateMsg[0] = `Stopped `;
                return stateMsg;
            case 'clear':
                console.clear();
                return ['Cleared Console', `enter commands after the $, for reference enter "help" or visit https://github.com/themoonisacheese/2bored2wait#commands`];
            case 'exit':
                if ((yield question('Are you really sure you want to quit? Your queue progress will be lost. [y|N]: ')).toLowerCase() === 'y')
                    process.exit(0);
                return ['Cancelled', 'Not quitting.'];
            default:
                if (/start (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd)) {
                    if (!!server)
                        return ['Error', 'if you are really sure you want to stop queuing now, first stop the program then try again'];
                    state = 'timedStart';
                    starttimestring = cmd.split(' ')[1];
                    timedStart = setTimeout(startQueuing, timeStringtoDateTime(cmd).toMillis() - luxon_1.DateTime.local().toMillis());
                    activity(`Starting at ${starttimestring}`);
                    return ['Timer', `Queue is starting at ${starttimestring}`];
                }
                else if (/^play (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd)) {
                    finishtimestring = cmd.split(' ')[1];
                    calcTime(cmd);
                    activity('You can play at ' + finishtimestring);
                    return ['Time calculating', `The perfect time to start the queue will be calculated, so you can play at ${finishtimestring}`];
                }
                else
                    return ['Error', 'Unknown Command'];
        }
    });
}
function startQueuing() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!!conn) {
            console.log('already queuing, stop then start if you really want to restart, current state:' + state);
            return;
        }
        state = 'auth';
        conn = new mcproxy.Conn({
            username: config.minecraftserver.onlinemode ? config.account.username : config.minecraftserver.username,
            password: config.account.password,
            profilesFolder: config.account.profilesFolder,
            auth: config.account.accountType,
            host: config.minecraftserver.hostname,
            port: config.minecraftserver.port,
            version: config.minecraftserver.version,
        });
        client = conn.bot._client;
        join();
    });
}
function stopQueuing() {
    stoppedByPlayer = true;
    stop();
}
function stop() {
    state = 'idle';
    webserver.isInQueue = false;
    finishedQueue = !config.minecraftserver.is2b2t;
    webserver.queuePlace = 'None';
    webserver.ETA = 'None';
    client === null || client === void 0 ? void 0 : client.end(''); // disconnect
    conn = null;
    if (proxyClient) {
        proxyClient.end('Stopped the proxy.'); // boot the player from the server
    }
    server === null || server === void 0 ? void 0 : server.close(); // close the server
    server = null;
}
function join() {
    state = 'auth';
    let positioninqueue = 'None';
    let lastQueuePlace = 'None';
    let notisend = false;
    webserver.isInQueue = true;
    activity('Starting the queue...');
    client.on('state', (cstate) => __awaiter(this, void 0, void 0, function* () {
        if (cstate === 'play')
            state = 'queue';
    }));
    client.on('packet', (data, meta) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        // each time 2b2t sends a packet
        switch (meta.name) {
            case 'playerlist_header':
                if (!finishedQueue && config.minecraftserver.is2b2t) {
                    // if the packet contains the player list, we can use it to see our place in the queue
                    let headermessage = JSON.parse(data.header);
                    positioninqueue = 'None';
                    try {
                        positioninqueue = headermessage.text.split('\n')[5].substring(25);
                    }
                    catch (e) {
                        if (e instanceof TypeError)
                            console.log("Reading position in queue from tab failed! Is the queue empty, or the server isn't 2b2t?");
                    }
                    if (positioninqueue !== 'None')
                        positioninqueue = Number(positioninqueue);
                    webserver.queuePlace = positioninqueue; // update info on the web page
                    if (lastQueuePlace === 'None' && positioninqueue !== 'None') {
                        queueStartPlace = positioninqueue;
                        queueStartTime = luxon_1.DateTime.local();
                    }
                    if (positioninqueue !== 'None' && lastQueuePlace !== positioninqueue) {
                        let ETAmin = (getWaitTime(queueStartPlace, 0) - getWaitTime(queueStartPlace, positioninqueue)) / 60;
                        webserver.ETA = Math.floor(ETAmin / 60) + 'h ' + Math.floor(ETAmin % 60) + 'm';
                        logActivity(`P: ${positioninqueue} E: ${webserver.ETA}` + (config.userStatus ? ` - ${(_a = client.username) !== null && _a !== void 0 ? _a : (config.minecraftserver.onlinemode ? config.account.username : config.minecraftserver.username)}` : ''));
                        if (config.notification.enabled && positioninqueue <= config.notification.queuePlace && !notisend && config.discordBot && dcUser != null) {
                            sendDiscordMsg(dcUser, 'Queue', 'The queue is almost finished. You are in Position: ' + webserver.queuePlace);
                            notisend = true;
                        }
                    }
                    lastQueuePlace = positioninqueue;
                }
                break;
            case 'chat':
                if (finishedQueue === false) {
                    // we can know if we're about to finish the queue by reading the chat message
                    // we need to know if we finished the queue otherwise we crash when we're done, because the queue info is no longer in packets the server sends us.
                    //? this is not true anymore now that mcproxy is used it is not necessary to log in before the queue finishes
                    let chatMessage = JSON.parse(data.message);
                    if ((chatMessage === null || chatMessage === void 0 ? void 0 : chatMessage.text) === 'Connecting to the server...') {
                        if (config.expandQueueData) {
                            queueData.place.push(queueStartPlace);
                            let timeQueueTook = luxon_1.DateTime.local().toSeconds() - queueStartTime.toSeconds();
                            let b = Math.pow((0 + c) / (queueStartPlace + c), 1 / timeQueueTook);
                            queueData.factor.push(b);
                            fs_1.default.writeFile('./config/queue.json', JSON.stringify(queueData), 'utf-8', () => { });
                        }
                        if (webserver.restartQueue && proxyClient == null) {
                            //if we have no client connected and we should restart
                            //? don't
                            stop();
                        }
                        else {
                            finishedQueue = true;
                            webserver.queuePlace = 'FINISHED';
                            webserver.ETA = 'NOW';
                            logActivity('Queue is finished');
                        }
                    }
                }
                break;
        }
    }));
    // set up actions in case we get disconnected.
    client.on('end', end);
    client.on('error', end);
    function end(err) {
        if (proxyClient) {
            proxyClient.end(`Connection reset by 2b2t server.${!!err ? `Error message: ${err}` : ''}\nReconnecting...`);
            proxyClient = null;
        }
        stop();
        if (!stoppedByPlayer && config.reconnect.onError) {
            log(`Connection reset by 2b2t server. Reconnecting in ${config.reconnect.timeout}ms...`);
            state = 'reconnect';
            reconnectTimeout = setTimeout(reconnect, config.reconnect.timeout);
            reconnectTimeoutStartTime = luxon_1.DateTime.now();
        }
    }
    server = minecraft_protocol_1.default.createServer({
        // create a server for us to connect to
        'online-mode': config.whitelist,
        // encryption: true,
        host: config.address.minecraft,
        port: config.ports.minecraft,
        version: config.MCversion,
        maxPlayers: 1,
        // beforePing: function(response, client){
        //   response.favicon =
        // }
    });
    server.on('login', (newProxyClient) => {
        // handle login
        if (config.whitelist && client.uuid !== newProxyClient.uuid) {
            newProxyClient.end('not whitelisted!\nYou need to use the same account as 2b2w or turn the whitelist off');
            return;
        } //@ts-ignore
        newProxyClient.on('packet', (data, meta, rawData) => {
            // redirect everything we do to 2b2t
            filterPacketAndSend(rawData, meta, client);
        });
        conn === null || conn === void 0 ? void 0 : conn.sendPackets(newProxyClient);
        conn === null || conn === void 0 ? void 0 : conn.link(newProxyClient);
        proxyClient = newProxyClient;
    });
}
function filterPacketAndSend(data, meta, dest) {
    if (meta.name !== 'keep_alive' && meta.name !== 'update_time') {
        //keep alive packets are handled by the client we created, so if we were to forward them, the minecraft client would respond too and the server would kick us for responding twice.
        dest.writeRaw(data);
    }
}
function logActivity(string) {
    if (config.userStatus)
        activity(string);
    if (server === null || server === void 0 ? void 0 : server.motd)
        server.motd = string.replace(/P:/, 'Place in Queue:').replace(/E:/, 'ETA:');
    log(string);
}
function activity(string) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        (_a = dc === null || dc === void 0 ? void 0 : dc.user) === null || _a === void 0 ? void 0 : _a.setActivity(string);
    });
}
function timeStringtoDateTime(time) {
    let starttime = time.split(' ')[1].split(':');
    let startdt = luxon_1.DateTime.local().set({ hour: Number(starttime[0]), minute: Number(starttime[1]), second: 0, millisecond: 0 });
    if (startdt.toMillis() < luxon_1.DateTime.local().toMillis())
        startdt = startdt.plus({ days: 1 });
    return startdt;
}
function calcTime(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        state = 'calcTime';
        calcInterval = setInterval(function () {
            https_1.default
                .get('https://2b2t.io/api/queue', (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    data = JSON.parse(data);
                    let queueLength = data[0][1];
                    let playTime = timeStringtoDateTime.bind(finishtimestring)(msg);
                    let waitTime = getWaitTime(Number(queueLength), 0);
                    if (playTime.toSeconds() - luxon_1.DateTime.local().toSeconds() < waitTime) {
                        startQueuing();
                        if (calcInterval)
                            clearInterval(calcInterval);
                        console.log(waitTime);
                    }
                });
            })
                .on('error', (err) => {
                log(String(err));
            });
        }, 60000);
    });
}
function reconnect() {
    state = 'reconnect';
    if (stoppedByPlayer)
        stoppedByPlayer = false;
    else {
        logActivity('Reconnecting... ');
        reconnectLoop();
    }
}
function log(logmsg) {
    if (config.logging) {
        fs_1.default.appendFile('2bored2wait.log', `${luxon_1.DateTime.local().toLocaleString({ hour: '2-digit', minute: '2-digit', hour12: false })}	${logmsg}\n`, (err) => {
            if (err)
                console.error(err);
        });
    }
    process.stdout.write(`\x1B[F\n${logmsg}\n$ ${rlIf.line}`);
}
function sendDiscordMsg(channel, title, content) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (dc === null || dc === void 0 ? void 0 : dc.user)
            try {
                channel === null || channel === void 0 ? void 0 : channel.send({
                    embed: {
                        color: 3447003,
                        author: {
                            name: (_a = client === null || client === void 0 ? void 0 : client.username) !== null && _a !== void 0 ? _a : (config.minecraftserver.onlinemode ? config.account.username : config.minecraftserver.username),
                            icon_url: client.uuid ? `https://crafatar.com/avatars/${client.uuid}?size=128` : dc.user.avatarURL,
                        },
                        fields: [
                            {
                                name: title,
                                value: content,
                            },
                        ],
                        timestamp: new Date(),
                        footer: {
                            // icon_url: client.uuid ? `https://crafatar.com/avatars/${client.uuid}?size=128` : ((dc.user.avatarURL as unknown) as string),
                            text: 'https://github.com/themoonisacheese/2bored2wait',
                        },
                    },
                });
            }
            catch (e) {
                log(e);
            }
    });
}
function getWaitTime(queueLength, queuePos) {
    let b = everpolate_1.default.linear(queueLength, queueData.place, queueData.factor)[0];
    return Math.log((queuePos + c) / (queueLength + c)) / Math.log(b); // see issue 141
}
function reconnectLoop() {
    minecraft_protocol_1.default.ping({ host: config.minecraftserver.hostname, port: config.minecraftserver.port }, (err) => {
        if (err) {
            log(`Error on 2b2t's side: ${err.message}`);
            reconnectTimeout = setTimeout(reconnectLoop, 3000);
            reconnectTimeoutStartTime = luxon_1.DateTime.now();
        }
        else
            startQueuing();
    });
}
