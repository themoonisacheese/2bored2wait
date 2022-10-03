// imports
const jsonminify = require("node-json-minify"); // to remove comments from the config.json, because normally comments in json are not allowed
const fs = require('fs');
const mc = require('minecraft-protocol'); // to handle minecraft login session
const webserver = require('./webserver/webserver.js'); // to serve the webserver
const opn = require('open'); //to open a browser window
const {
	Client,
	discord,
	Intents,
	MessageEmbed
} = require('discord.js');
const {
	DateTime
} = require("luxon");
const https = require("https");
const everpolate = require("everpolate");
const mcproxy = require("@rob9315/mcproxy");
const antiafk = require("mineflayer-antiafk");
const queueData = require("./queue.json");
const util = require("./util");
const save = "./saveid";
var config;
// This dummy var is a workaround to allow binaries
const path = require('path');
// const configPath = path.join(process.cwd(), './config/default.json');
// const data = fs.readFileSync(configPath);
try {
	config = require("config");
} catch (err) {
	if (String(err).includes("SyntaxError: ")) {
		console.error("The syntax in your config file is not correct. Make sure you replaced all values as the README says under 'How to Install' step 5. If it still does not work, check that all quotes are closed. You can look up the json syntax online. Please note that the comments are no problem although comments are normally not allowed in json. " + err)
		process.exit(1);
	}
}
var mc_username;
var mc_password;
var updatemessage;
var discordBotToken;
var savelogin;
var secrets;
var whitelistUUIDs = [];
var whitelistNames = Array.from(config.whitelist.users);
var accountType;
let launcherPath;
let c = 150;
let finishedQueue = false
let dc;
const rl = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout
});
const promisedQuestion = (text) => {
	return new Promise((resolve) => rl.question(text, resolve))
}
const guessLauncherPath = () => {
	const appdata = process.env.APPDATA
	return appdata ? `${appdata}/.minecraft` : (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support/minecraft` : `${process.env.HOME}/.minecraft`)
}
const askForSecrets = async () => {
	let localConf = {};
	const config_dir = process.env["NODE_CONFIG_DIR"] ?? 'config';
	try {
		localConf = util.readJSON(config_dir + '/local.json');
	} catch (err) {
		if (err.code != "ENOENT") throw err;
	}
	let canSave = false;
	if (!(config.has("username") && config.has("mcPassword") && config.has("updatemessage"))) {
		canSave = true;
		accountType = ((await promisedQuestion("Account type, mojang (1) or microsoft (2) [1]: ")) === "2" ? "microsoft" : "mojang");
		if (accountType == "mojang") {
			mc_username = await promisedQuestion("Email: ");
			mc_password = await promisedQuestion("Password: ");
		} else {
			mc_username = await promisedQuestion("Email: ");
			mc_password = ""
		}
		localConf.accountType = accountType;
		localConf.mcPassword = mc_password;
		localConf.username = mc_username;
		updatemessage = await promisedQuestion("Update Messages? Y or N [Y]: ");
		localConf.updatemessage = updatemessage;
	}
	if ((!config.has("discordBot") || config.get("discordBot")) && !config.has("BotToken")) {
		canSave = true;
		discordBotToken = await promisedQuestion("BotToken, leave blank if not using discord []: ");
		localConf.BotToken = discordBotToken;
	}
	localConf.discordBot = discordBotToken === "" ? false : config.has("discordBot") && config.get("discordBot");

	if (canSave) {

		savelogin = await promisedQuestion("Save login for later use? Y or N [N]: ");
		if (savelogin.toLowerCase() === "y") {
			fs.writeFile(config_dir + '/local.json', JSON.stringify(localConf, null, 2), (err) => {
				if (err) console.log(err);
			});
		};
		console.clear();
	}
	if (localConf.discordBot) {
		dc = new Client({
			intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
		});
		dc.login(discordBotToken ?? config.get('BotToken')).catch(() => {
			console.warn("There was an error when trying to log in using the provided Discord bot token. If you didn't enter a token this message will go away the next time you run this program!"); //handle wrong tokens gracefully
		});
		dc.on('ready', () => {
			dc.user.setActivity("Queue is stopped.");
			fs.readFile(save, "utf8", (err, id) => {
				if (!err) dc.users.fetch(id).then(user => {
					dcUser = user;
				});
			});
		});

		dc.on('messageCreate', function (message) {
			if (message.author.username !== dc.user.username) {
				userInput(message.content, true, message);
				if (dcUser == null || message.author.id !== dcUser.id) {
					fs.writeFile(save, message.author.id, function (err) {
						if (err) {
							throw err;
						}
					});
				}
				dcUser = message.author;
			}
		});
	}
	console.log(`Finished setting up 2b2w. Type "Start" to start the queue. Type "Help" for the list of commands.`);
	cmdInput();
	joinOnStart();
}

if (!config.get("minecraftserver.onlinemode")) cmdInput();
else {
	mc_username = config.username;
	mc_password = config.mcPassword;
	launcherPath = config.profilesFolder;
	accountType = config.get("accountType");
	discordBotToken = config.BotToken
	if (config.whitelist.enabled) {
		util.getUUIDForWhitelist(whitelistNames).then(res => {
			whitelistUUIDs = res
			askForSecrets();
		})
	} else {
		askForSecrets();
	}
}

var stoppedByPlayer = false;
var timedStart;
let dcUser; // discord user that controls the bot
var totalWaitTime;
var starttimestring;
var options;
var doing;
let interval = {};
let queueStartPlace;
let queueStartTime;
webserver.restartQueue = config.get("reconnect.notConnectedQueueEnd");
webserver.onstart(() => { // set up actions for the webserver
	startQueuing();
});
webserver.onstop(() => {
	stopQueing();
});
if (config.get("webserver")) {
	let webPort = config.get("ports.web");
	webserver.createServer(webPort, config.get("address.web")); // create the webserver
	webserver.password = config.password
	if (config.get("openBrowserOnStart")) opn('http://localhost:' + webPort); //open a browser window
}
// lets
let proxyClient; // a reference to the client that is the actual minecraft game
let client; // the client to connect to 2b2t
let server; // the minecraft server to pass packets
let conn; // connection object from mcproxy for the client variable

options = {
	host: config.get("minecraftserver.hostname"),
	port: config.get("minecraftserver.port"),
	version: config.get("minecraftserver.version")
}

function startAntiAntiAFK() {
	if (!config.has("antiAntiAFK.enabled") || !config.get("antiAntiAFK.enabled")) return;
	if (proxyClient != null || !webserver.isInQueue || !finishedQueue) return;
	conn.bot.afk.start();
}

function cmdInput() {
	rl.question("$ ", (cmd) => {
		userInput(cmd, false);
		cmdInput();
	});
}

// function to disconnect from the server
function stop() {
	webserver.isInQueue = false;
	finishedQueue = false
	webserver.queuePlace = "None";
	webserver.ETA = "None";
	if (client) {
		client.end(); // disconnect
	}
	if (proxyClient) {
		proxyClient.end("Stopped the proxy."); // boot the player from the server
	}
	if (server) {
		server.close(); // close the server
	}
}

// function to start the whole thing
function startQueuing() {
	stopQueing();
	doing = "auth";
	if (config.get("minecraftserver.onlinemode")) {
		options.username = mc_username;
		options.password = mc_password;
		options.profilesFolder = launcherPath;
		options.auth = accountType;
	} else {
		options.username = config.get("minecraftserver.username");
	}
	conn = new mcproxy.Conn(options); // connect to 2b2t
	client = conn.bot._client;
	conn.bot.loadPlugin(antiafk);
	conn.bot.afk.setOptions(config.get("antiAntiAFK").get("config"));
	join();
}

function join() {
	let lastQueuePlace = "None";
	let notisend = false;
	var PositionError = false;
	let displayEmail = config.get("displayEmail")

	doing = "queue"
	webserver.isInQueue = true;
	startAntiAntiAFK(); //for non-2b2t servers
	activity("Starting the queue...");
	client.on("packet", (data, meta) => { // each time 2b2t sends a packet
		switch (meta.name) {
			case "playerlist_header":
				if (!finishedQueue && true) { // if the packet contains the player list, we can use it to see our place in the queue
					let messageheader = data.header;
					let positioninqueue = "None";
					try {
						positioninqueue = messageheader.split('text')[5].replace(/\D/g, '');
					} catch (e) {
						if (e instanceof TypeError && (PositionError !== true)) {
							console.log("Reading position in queue from tab failed! Is the queue empty, or the server isn't 2b2t?");
							PositionError = true;
						}
					}
					if (positioninqueue !== "None") positioninqueue = Number(positioninqueue);
					webserver.queuePlace = positioninqueue; // update info on the web page
					if (lastQueuePlace === "None" && positioninqueue !== "None") {
						queueStartPlace = positioninqueue;
						queueStartTime = DateTime.local();
					}
					if (positioninqueue !== "None" && lastQueuePlace !== positioninqueue) {
						let totalWaitTime = getWaitTime(queueStartPlace, 0);
						let timepassed = getWaitTime(queueStartPlace, positioninqueue);
						let ETAmin = (totalWaitTime - timepassed) / 60;
						server.favicon = (config.has("favicon") ? config.get("favicon") : `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`)
						server.motd = `Place in queue: ${webserver.queuePlace} ETA: ${webserver.ETA}`; // set the MOTD because why not
						webserver.ETA = Math.floor(ETAmin / 60) + "h " + Math.floor(ETAmin % 60) + "m";
						webserver.finTime = new Date((new Date()).getTime() + ETAmin * 60000);
						if (config.get("userStatus")) {
							//set the Discord Activity
							if (displayEmail) {
								logActivity("P: " + positioninqueue + " E: " + webserver.ETA + " - " + options.username);
							} else {
								logActivity("P: " + positioninqueue + " E: " + webserver.ETA + " - " + client.username);
							}
						} else {
							logActivity("P: " + positioninqueue + " E: " + webserver.ETA);
						}
						if (config.get("notification.enabled") && positioninqueue <= config.get("notification.queuePlace") && !notisend && config.discordBot && dcUser != null) {
							sendDiscordMsg(dcUser, "Queue", "The queue is almost finished. You are in Position: " + webserver.queuePlace);
							notisend = true;
						}
					}
					lastQueuePlace = positioninqueue;
				}
				break;
			case "chat":
				if (finishedQueue === false) { // we can know if we're about to finish the queue by reading the chat message
					// we need to know if we finished the queue otherwise we crash when we're done, because the queue info is no longer in packets the server sends us.
					let chatMessage = JSON.parse(data.message).text;
					if (chatMessage == "Connected to the server.") {
						if (config.get("expandQueueData")) {
							queueData.place.push(queueStartPlace);
							let timeQueueTook = DateTime.local().toSeconds() - queueStartTime.toSeconds();
							let b = Math.pow((0 + c) / (queueStartPlace + c), 1 / timeQueueTook);
							queueData.factor.push(b);
							fs.writeFile("queue.json", JSON.stringify(queueData), "utf-8", (err) => {
								log(err);
							});
						}
						if (webserver.restartQueue && proxyClient == null) { //if we have no client connected and we should restart
							stop();
							reconnect();
						} else {
							finishedQueue = true;
							startAntiAntiAFK();
							webserver.queuePlace = "FINISHED";
							webserver.ETA = "NOW";
							logActivity("Queue is finished");
						}
					}
				}
				break;
		}
	});

	// set up actions in case we get disconnected.
	const onDisconnect = () => {
		if (proxyClient) {
			proxyClient.end("Connection reset by 2b2t server.\nReconnecting...");
			proxyClient = null
		}
		stop();
		if (!stoppedByPlayer) {
			log(`Connection reset by 2b2t server. Reconnecting...`);
			if (!config.has("MCpassword") && !config.has("password")) log("If this ^^ message shows up repeatedly, it is likely a problem with your token being invalidated. Please start minecraft manually or use credential authentication instead.");
		}
		if (config.reconnect.onError) setTimeout(reconnect, 30000);
	}
	client.on('end', onDisconnect);
	client.on('error', onDisconnect);

	server = mc.createServer({ // create a server for us to connect to
		'online-mode': config.get("whitelist"),
		encryption: true,
		host: config.get("address.minecraft"),
		port: config.get("ports.minecraft"),
		version: config.MCversion,
		'max-players': maxPlayers = 1
	});

	server.on('login', (newProxyClient) => { // handle login
		if (config.whitelist.enabled) {
			if (!whitelistUUIDs.map(user => user.id == newProxyClient.uuid.replaceAll('-', '')).includes(true)) {
				newProxyClient.end("Not whitelisted!");
				return;
			}
		}
		else if (client.uuid !== newProxyClient.uuid) {
			newProxyClient.end("Not whitelisted!");
			return;
		}
		newProxyClient.on('packet', (data, meta, rawData) => { // redirect everything we do to 2b2t
			filterPacketAndSend(rawData, meta, client);
		});
		newProxyClient.on("end", () => {
			proxyClient = null;
			startAntiAntiAFK();
		})
		conn.bot.afk.stop().then(() => {
			conn.sendPackets(newProxyClient);
			conn.link(newProxyClient);
			proxyClient = newProxyClient;
		});
	});
}


function log(logmsg) {
	if (config.get("logging")) {
		fs.appendFile('2bored2wait.log', DateTime.local().toLocaleString({
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}) + "	" + logmsg + "\n", err => {
			if (err) console.error(err)
		})
	}
	let line = rl.line;
	process.stdout.write("\033[F\n" + logmsg + "\n$ " + line);
}

function reconnect() {
	doing = "reconnect";
	if (stoppedByPlayer) stoppedByPlayer = false;
	else {
		logActivity("Reconnecting... ");
		reconnectLoop();
	}
}

function reconnectLoop() {
	mc.ping({
		host: config.minecraftserver.hostname,
		port: config.minecraftserver.port
	}, (err) => {
		if (err) setTimeout(reconnectLoop, 3000);
		else startQueuing();
	});
}

//function to filter out some packets that would make us disconnect otherwise.
//this is where you could filter out packets with sign data to prevent chunk bans.
function filterPacketAndSend(data, meta, dest) {
	if (meta.name !== "keep_alive" && meta.name !== "update_time") { //keep alive packets are handled by the client we created, so if we were to forward them, the minecraft client would respond too and the server would kick us for responding twice.
		dest.writeRaw(data);
	}
}

function round(number) {
	if (number > 0) return Math.ceil(number);
	else return Math.floor(number);
}

function activity(string) {
	dc?.user?.setActivity(string);
}

//the discordBot part starts here.

function userInput(cmd, DiscordOrigin, discordMsg, channel) {
	let splitCmd = cmd.split(" ")
	cmd = cmd.toLowerCase();
	if (cmd.includes(" ")) {
		cmd = cmd.split(" ")[0]
	}

	switch (cmd) {
		case "help":
		case "commands":
			console.log(" help: Lists available commands.");
			console.log(" start 14:00: Start queue at 2pm.");
			console.log(" play 8:00: Tries to calculate the right time to join so you can play at 8:00am.");
			console.log(" start: Starts the queue.");
			console.log(" loop: Restarts the queue if you are not connect at the end of it");
			console.log(" loop status: Lets you know if you have reconnect on or off.")
			console.log(" update: Sends an update to the current channel with your position and ETA.");
			console.log(" url: displays the github url");
			console.log(" stop: Stops the queue.");
			console.log(" exit or quit: Exits the application.");
			console.log(" stats: Displays your health and hunger.");
			console.log(" whitelist add [username]: Adds user to whitelist for this session.");
			console.log(" whitelist remove [username]: Removes user from whitelist for this session.");
			console.log(" whitelist list: Lists all whitelisted users.");
			break;
		case "stats":
			try {
				if (conn.bot.health == undefined && conn.bot.food == undefined) {
					console.log("Unknown.")
					break;
				}
				else {
					if (conn.bot.health == 0)
						console.log("Health: DEAD");
					else
						console.log("Health: " + Math.ceil(conn.bot.health) / 2 + "/10");
					if (conn.bot.food == 0)
						console.log("Hunger: STARVING");
					else
						console.log("Hunger: " + conn.bot.food / 2 + "/10");
				}
			} catch (err) { console.log(`Start 2B2W first with "Start".`) }
			break;

		case "url":
			console.log("https://github.com/themoonisacheese/2bored2wait");
			break;

		case "loop":
			console.log("Syntax: status, enable, disable");
			break;
		case "loop status":
			if (JSON.stringify(webserver.restartQueue) == "true")
				console.log("Loop is enabled");
			else
				console.log("Loop is disabled");
			break;
		case "loop enable":
			if (JSON.stringify(webserver.restartQueue) == "true")
				console.log("Loop is already enabled!");
			else {
				webserver.restartQueue = true
				console.log("Enabled Loop");
			}
			break;
		case "loop disable":
			if (JSON.stringify(webserver.restartQueue) == "false")
				console.log("Loop is already disabled!");
			else {
				webserver.restartQueue = false
				console.log("Disabled Loop");
			}
			break;

		case "start":
			startQueuing();
			msg(DiscordOrigin, discordMsg, "Queue", "Queue is starting up");
			break;

		case "exit":
		case "quit":
			return process.exit(0);

		case "whitelist":
			if (splitCmd[1] == "add") {
				check = util.getUUIDForWhitelist(splitCmd[2])
				check.then(promise => {
					if (promise[0] != undefined) {
						whitelistUUIDs.push(promise[0])
						msg(DiscordOrigin, discordMsg, "Whitelist", `Added ${splitCmd[2]} to Whitelist!`)
					} else {
						msg(DiscordOrigin, discordMsg, "Whitelist", "Username wrong?");
					}
				})
			} else if (splitCmd[1] == "delete" || splitCmd[1] == "remove") {
				check = util.getUUIDForWhitelist(splitCmd[2])
				check.then(usrObj => {
					if (usrObj[0] != undefined) {
						whitelistUUIDs = whitelistUUIDs.filter(({ id }) => id !== usrObj[0].id)
						msg(DiscordOrigin, discordMsg, "Whitelist", `Removed ${splitCmd[2]} from Whitelist!`)
					} else {
						msg(DiscordOrigin, discordMsg, "Whitelist", "Username wrong?");
					}
				})
			} else if (splitCmd[1] == "list") {
				msg(DiscordOrigin, discordMsg, "Whitelist", "Listing all whitelisted Users" + whitelistUUIDs.map(accounts => "\n" + accounts.name + ""));
			} else {
				msg(DiscordOrigin, discordMsg, "Whitelist", "Wrong Syntax for Whitelist command!")
			}
			break;

		case "update":
			switch (doing) {
				case "queue":
					msg(DiscordOrigin, discordMsg, "Reconnecting", `Position: ${webserver.queuePlace} \n Estimated time until login: ${webserver.ETA}`);
					console.log("Position: " + webserver.queuePlace + "  Estimated time until login: " + webserver.ETA);
					break;
				case "timedStart":
					msg(DiscordOrigin, discordMsg, "Timer", "Timer is set to " + starttimestring);
					break;
				case "reconnect":
					msg(DiscordOrigin, discordMsg, "Reconnecting", "2b2t is currently offline. Trying to reconnect");
					break;
				case "auth":
					let authMsg = "Authentication";
					msg(DiscordOrigin, discordMsg, authMsg, authMsg);
					break;
				case "calcTime":
					let calcMsg =
						msg(DiscordOrigin, discordMsg, "Calculating time", "Calculating the time, so you can play at " + starttimestring);
					break;
			}
			break;
		case "stop":
			switch (doing) {
				case "queue":
					stopQueing();
					stopMsg(DiscordOrigin, discordMsg, "Queue");
					break;
				case "timedStart":
					clearTimeout(timedStart);
					stopMsg(DiscordOrigin, discordMsg, "Timer");
					break;
				case "reconnect":
					clearInterval(interval.reconnect);
					stopMsg(DiscordOrigin, discordMsg, "Reconnecting");
					break;
				case "auth":
					clearInterval(interval.auth);
					stopMsg(DiscordOrigin, discordMsg, "Authentication");
					break;
				case "calcTime":
					clearInterval(interval.calc);
					stopMsg(DiscordOrigin, discordMsg, "Time calculation");
					break;
			}
			break;
		default:
			if (/start (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd)) {
				doing = "timedStart"
				timedStart = setTimeout(startQueuing, timeStringtoDateTime(cmd).toMillis() - DateTime.local().toMillis());
				activity("Starting at " + starttimestring);
				msg(DiscordOrigin, discordMsg, "Timer", "Queue is starting at " + starttimestring);
			} else if (/^play (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd)) {
				timeStringtoDateTime(cmd);
				calcTime(cmd);
				msg(DiscordOrigin, discordMsg, "Time calculator", "The perfect time to start the queue will be calculated, so you can play at " + starttimestring);
				activity("You can play at " + starttimestring);
			} else msg(DiscordOrigin, discordMsg, "Error", `Unknown command. Type "Help" for the list of commands.`);
	}
}

function stopMsg(discordOrigin, discordMsg, stoppedThing) {
	msg(discordOrigin, discordMsg, stoppedThing, stoppedThing + " is **stopped**");
	activity(stoppedThing + " is stopped.");
}

function msg(discordOrigin, msg, title, content) {
	if (discordOrigin) sendDiscordMsg(msg.channel, title, content);
	else console.log(content);
}

function sendDiscordMsg(channel, title, content) {
	const MessageEmbed = {
		color: 3447003,
		author: {
			name: dc.user.username,
			icon_url: dc.user.avatarURL
		},
		fields: [{
			name: title,
			value: content
		}],
		timestamp: new Date(),
		footer: {
			icon_url: dc.user.avatarURL,
			text: "Author: MrGeorgen"
		}
	}
	channel.send({
		embeds: [MessageEmbed]
	}).catch(() => {
		console.warn(`There was a permission error! Please make sure your bot has perms to talk.`); //handle wrong tokens gracefully
	});
}

function timeStringtoDateTime(time) {
	starttimestring = time.split(" ");
	starttimestring = starttimestring[1];
	let starttime = starttimestring.split(":");
	let startdt = DateTime.local().set({
		hour: starttime[0],
		minute: starttime[1],
		second: 0,
		millisecond: 0
	});
	if (startdt.toMillis() < DateTime.local().toMillis()) startdt = startdt.plus({
		days: 1
	});
	return startdt;
}

function calcTime(msg) {
	https.get('https://2b2t.io/api/queue', function (res) {
		doing = "calcTime"
		interval.calc = setInterval(function () {
			https.get("https://2b2t.io/api/queue", (resp) => {
				let data = '';
				resp.on('data', (chunk) => {
					data += chunk;
				});
				resp.on("end", () => {
					data = JSON.parse(data);
					let queueLength = data[0][1];
					let playTime = timeStringtoDateTime(msg);
					let waitTime = getWaitTime(queueLength, 0);
					if (playTime.toSeconds() - DateTime.local().toSeconds() < waitTime) {
						startQueuing();
						clearInterval(interval.calc);
						console.log(waitTime);
					}
				});
			}).on("error", (err) => {
				log(err)
			});
		}, 60000);
	}).on('error', function (e) {
		console.log(`2b2t.io is currently offline. Please try again later to use the "play" command.`)
	});
}


function stopQueing() {
	stoppedByPlayer = true;
	stop();
}

function logActivity(update) {
	activity(update);
	log(update);
}

function joinOnStart() {
	if (config.get("joinOnStart")) setTimeout(startQueuing, 1000);
}

function getWaitTime(queueLength, queuePos) {
	let b = everpolate.linear(queueLength, queueData.place, queueData.factor)[0];
	return Math.log((queuePos + c) / (queueLength + c)) / Math.log(b); // see issue 141
}
process.on('uncaughtException', err => {
	const boxen = require("boxen")
	console.error(err);
	console.log(boxen(`Something went wrong! Feel free to contact us on discord or github! \n\n Github: https://github.com/themoonisacheese/2bored2wait \n\n Discord: https://discord.next-gen.dev/`, { title: 'Something Is Wrong', titleAlignment: 'center', padding: 1, margin: 1, borderStyle: 'bold', borderColor: 'red', backgroundColor: 'red', align: 'center' }));
	console.log('Press any key to exit');
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on('data', process.exit.bind(process, 0));
});

module.exports = {
	startQueue: function () {
		startQueuing();
	},
	filterPacketAndSend: function () {
		filterPacketAndSend();
	},
	stop: function () {
		stopQueing();
	}
};
