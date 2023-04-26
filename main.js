// imports
const fs = require('fs');
const mc = require('minecraft-protocol'); // to handle minecraft login session
const notifier = require('node-notifier'); // Required to send desktop notifications

// someone decided to use webserver as a variable to store other data, ok.
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
let config;
// This dummy var is a workaround to allow binaries
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
let mc_username;
let mc_password;
let updatemessage;
let discordBotToken;
let savelogin;
let accountType;
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
	askForSecrets();
}

let stoppedByPlayer = false;
let timedStart;
let dcUser; // discord user that controls the bot
let starttimestring;
let options;
let doing;
let interval = {};
let queueStartPlace;
let queueStartTime;
webserver.restartQueue = config.get("reconnect.notConnectedQueueEnd");
webserver.onstart(startQueuing);
webserver.onstop(stopQueing);
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
	let positionError = false;
	let displayEmail = config.get("displayEmail")
	let notificationsEnabled = config.get("desktopNotifications.enabled");
    const threshold = config.get("desktopNotifications.threshold");
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
						positioninqueue = messageheader.split("ue")[2].split("\\")[0].slice(9);
					} catch (e) {
						if (e instanceof TypeError && (positionError !== true)) {
							console.log("Reading position in queue from tab failed! Is the queue empty, or the server isn't 2b2t?");
							positionError = true;
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
						server.favicon = config.has("favicon") ? config.get("favicon") : fs.readFileSync("favicon.png").toString("base64");
						server.motd = `Place in queue: ${webserver.queuePlace} ETA: ${webserver.ETA}`; // set the MOTD because why not
						webserver.ETA = Math.floor(ETAmin / 60) + "h " + Math.floor(ETAmin % 60) + "m";
						webserver.finTime = new Date((new Date()).getTime() + ETAmin * 60000);
						if (config.get("userStatus")) {
							//set the Discord Activity
							const name = displayEmail?options.username:client.username;
							logActivity("P: " + positioninqueue + " E: " + webserver.ETA + " - " + name);
						} else {
							logActivity("P: " + positioninqueue + " E: " + webserver.ETA);
						}
						if (config.get("notification.enabled") && positioninqueue <= config.get("notification.queuePlace") && !notisend && config.discordBot && dcUser != null) {
							sendDiscordMsg(dcUser, "Queue", "The queue is almost finished. You are in Position: " + webserver.queuePlace);
							notisend = true;
						}
						if (positioninqueue <= threshold && notificationsEnabled){
						notifier.notify({// Send the notification
                            title: 'Your queue is ' + threshold + '!',
                            message: 'Your queue is ' + threshold + '!',
							sound: true,
							wait: true});
							notificationsEnabled = false};// The flag is set to false to prevent the notification from being shown again
					}
					lastQueuePlace = positioninqueue;
				}
				break;
			case "chat":
				if (finishedQueue === false) { // we can know if we're about to finish the queue by reading the chat message
					// we need to know if we finished the queue otherwise we crash when we're done, because the queue info is no longer in packets the server sends us.
					let chatMessage = JSON.parse(data.message).text;
					if (chatMessage == 'Queued for server main.' || chatMessage == 'You are already queued to server main.')
					console.log("2B2T says: " + chatMessage);
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
		if (config.whitelist && client.uuid !== newProxyClient.uuid) {
			newProxyClient.end("not whitelisted!\nYou need to use the same account as 2b2w or turn the whitelist off");
			return;
		}
		newProxyClient.on('packet', (_, meta, rawData) => { // redirect everything we do to 2b2t
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

function activity(string) {
	dc?.user?.setActivity(string);
}

//the discordBot part starts here.

function userInput(cmd, DiscordOrigin, discordMsg) {
	// this makes no sense, some commands reply to discord bot some log to console?
	cmd = cmd.toLowerCase();
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
			break;
		case "stats":
			try {
			if (conn.bot.health == undefined && conn.bot.food == undefined){
			console.log("Unknown.")
			break;}
			else
			{if (conn.bot.health == 0)
			console.log("Health: DEAD");
			else
			console.log("Health: " + Math.ceil(conn.bot.health)/2 + "/10");
			if (conn.bot.food == 0)
			console.log("Hunger: STARVING");
			else
			console.log("Hunger: " + conn.bot.food/2 + "/10");}
			} catch (err)
			{console.log(`Start 2B2W first with "Start".`)}
			break;

		case "url":
			console.log("https://github.com/themoonisacheese/2bored2wait");
			break;

		case "loop":
			console.log("Syntax: status, enable, disable");
			break;
		case "loop status":
			if (webserver.restartQueue)
				console.log("Loop is enabled");
			else
				console.log("Loop is disabled");
			break;
		case "loop enable":
			if (webserver.restartQueue)
				console.log("Loop is already enabled!");
			else {
				webserver.restartQueue = true
				console.log("Enabled Loop");
			}
			break;
		case "loop disable":
			if (!webserver.restartQueue)
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
	if (config.get("dc_chat")) {
	channel.send({
		embeds: [MessageEmbed]
	}).catch(() => {
		console.warn(`There was a permission error! Please make sure your bot has perms to talk.`); //handle wrong tokens gracefully
	})};
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
	console.log(boxen(`Something went wrong! Feel free to contact us on discord or github! \n\n Github: https://github.com/themoonisacheese/2bored2wait \n\n Discord: https://discord.next-gen.dev/`, {title: 'Something Is Wrong', titleAlignment: 'center', padding: 1, margin: 1, borderStyle: 'bold', borderColor: 'red', backgroundColor: 'red', align: 'center'}));	
	console.log('Press any key to exit');
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on('data', process.exit.bind(process, 0));
});
  
module.exports = {
	startQueue: startQueuing,
	filterPacketAndSend: filterPacketAndSend,
	stop: stopQueing,
};
