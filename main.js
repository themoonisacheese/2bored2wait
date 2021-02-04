// imports
const jsonminify = require("node-json-minify"); // to remove comments from the config.json, because normally comments in json are not allowed
const fs = require('fs');
const mc = require('minecraft-protocol'); // to handle minecraft login session
const webserver = require('./webserver.js'); // to serve the webserver
const opn = require('open'); //to open a browser window
const discord = require('discord.js');
const {DateTime} = require("luxon");
const https = require("https");
const everpolate = require("everpolate");
const cachePackets = require('./cachePackets.js');
const queueData = require("./queue.json");
const save = "./saveid";
var mc_username;
var mc_password;
var discordBotToken;
var savelogin;
var secrets;
var config;
var accountType;
let c = 150;
try {
	config = JSON.parse(jsonminify(fs.readFileSync("./config.json", "utf8"))); // Read the config
} catch (err) {
	throw("error loading config file:\n" + err);
}
let finishedQueue = !config.minecraftserver.is2b2t;
const rl = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout
});
try {
	secrets = JSON.parse(jsonminify(fs.readFileSync("./secrets.json", "utf8")));
	mc_username = secrets.username;
	mc_password = secrets.password;
	accountType = secrets.accountType
	discordBotToken = secrets.BotToken
	cmdInput();
	joinOnStart();
} catch (err) {
	if(err.code !== 'ENOENT') throw "error loading secrets.json:\n" +  err;
	config.discordBot = false;
	if(config.minecraftserver.onlinemode) {
		console.log("Please enter your credentials.");
		rl.question("account type, mojang or microsoft: ", function(type) {
			accountType = type;
			rl.question("Email: ", function(username) {
				rl.question("Password: ", function(userpassword) {
					rl.question("BotToken, leave blank if not using discord: ", function(discordBotToken) {
						rl.question("Save login for next use? Y or N:", function(savelogin) {
							mc_username = username;
							mc_password = userpassword;
							if (savelogin === "Y" || savelogin === "y") {
								if (discordBotToken === "") {
									discordBotToken = "DiscordBotToken"
								}
								fs.writeFile('./secrets.json', `
	      {
		  "username":"${username}",
		  "password":"${userpassword}",
		  "BotToken":"${discordBotToken}",
		  "authType":"${type}"
	      }`, function (err) {
		      if (err) return console.log(err);});
						};
						console.clear();
						cmdInput();
						joinOnStart();
					});
				});
			});
		});
		});
	}
}

var stoppedByPlayer = false;
var timedStart;
let dcUser; // discord user that controlls the bot
var totalWaitTime;
var starttimestring;
var options;
var doing;
let interval = {};
let queueStartPlace;
let queueStartTime;
webserver.restartQueue = config.reconnect.notConnectedQueueEnd;
if (config.webserver) {
	webserver.createServer(config.ports.web); // create the webserver
	webserver.password = config.password
}
webserver.onstart(() => { // set up actions for the webserver
	startQueuing();
});
webserver.onstop(() => {
	stopQueing();
});
if (config.openBrowserOnStart && config.webserver) {
	opn('http://localhost:' + config.ports.web); //open a browser window
}
// lets
var proxyClient; // a reference to the client that is the actual minecraft game
let client; // the client to connect to 2b2t
let server; // the minecraft server to pass packets

options = {
	host: config.minecraftserver.hostname,
	port: config.minecraftserver.port,
	version: config.minecraftserver.version
}
if (config.antiAntiAFK) setInterval(function () {
	if(proxyClient == null && webserver.isInQueue && finishedQueue) client.write("chat", { message: "!que", position: 1 })
}, 50000)

function cmdInput() {
	rl.question("$ ", (cmd) => {
		userInput(cmd, false);
		cmdInput();
	});
}

// function to disconnect from the server
function stop() {
	webserver.isInQueue = false;
	finishedQueue = !config.minecraftserver.is2b2t;
	webserver.queuePlace = "None";
	webserver.ETA = "None";
	client.end(); // disconnect
	if (proxyClient) {
		proxyClient.end("Stopped the proxy."); // boot the player from the server
	}
	server.close(); // close the server
}

// function to start the whole thing
function startQueuing() {
	doing = "auth";
	if (config.minecraftserver.onlinemode) {
		options.username = mc_username;
		options.password = mc_password;
		options.auth = accountType;
	} else {
		options.username = config.minecraftserver.username;
	}
	client = mc.createClient(options);// connect to 2b2t
	join();
}

function join() {
	let positioninqueue = "None";
	let lastQueuePlace = "None";
	let notisend = false;
	doing = "queue"
	webserver.isInQueue = true;
	activity("Starting the queue...");
	cachePackets.init(client, config.chunkCaching);
	client.on("packet", (data, meta, rawData) => { // each time 2b2t sends a packet
		switch (meta.name) {
			case "playerlist_header":
				if (!finishedQueue && config.minecraftserver.is2b2t) { // if the packet contains the player list, we can use it to see our place in the queue
					let headermessage = JSON.parse(data.header);
					let positioninqueue = headermessage.text.split("\n")[5].substring(25);
					if(positioninqueue !== "None") positioninqueue = Number(positioninqueue);
					webserver.queuePlace = positioninqueue; // update info on the web page
					if(lastQueuePlace === "None" && positioninqueue !== "None") {
						queueStartPlace = positioninqueue;
						queueStartTime = DateTime.local();
					}
					if (positioninqueue !== "None" && lastQueuePlace !== positioninqueue) {
						let totalWaitTime = getWaitTime(queueStartPlace, 0);
						let timepassed = getWaitTime(queueStartPlace, positioninqueue);
						let ETAmin = (totalWaitTime - timepassed) / 60;
						server.motd = `Place in queue: ${webserver.queuePlace} ETA: ${webserver.ETA}`; // set the MOTD because why not
						webserver.ETA = Math.floor(ETAmin / 60) + "h " + Math.floor(ETAmin % 60) + "m";
						if (config.userStatus === true) { //set the Discord Activity
							logActivity("P: " + positioninqueue + " E: " + webserver.ETA + " - " + options.username);
						} else {
							logActivity("P: " + positioninqueue + " E: " + webserver.ETA);
						}
						if (config.notification.enabled && positioninqueue <= config.notification.queuePlace && !notisend && config.discordBot && dcUser != null) {
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
					let chatMessage = JSON.parse(data.message);
					if (chatMessage.text && chatMessage.text === "Connecting to the server...") {
						queueData.place.push(queueStartPlace);
						let timeQueueTook = DateTime.local().toSeconds() - queueStartTime.toSeconds();
						let b = Math.pow((0 + c)/(queueStartPlace + c), 1/timeQueueTook);
						queueData.factor.push(b);
						fs.writeFile("queue.json", JSON.stringify(queueData), "utf-8", () => {});
						if (webserver.restartQueue && proxyClient == null) { //if we have no client connected and we should restart
							stop();
						} else {
							finishedQueue = true;
							webserver.queuePlace = "FINISHED";
							webserver.ETA = "NOW";
							logActivity("Queue is finished");
						}
					}
				}
				break;
		}
		if (proxyClient) { // if we are connected to the proxy, forward the packet we recieved to our game.
			filterPacketAndSend(rawData, meta, proxyClient);
		}
	});

	// set up actions in case we get disconnected.
	client.on('end', () => {
		if (proxyClient) {
			proxyClient.end("Connection reset by 2b2t server.\nReconnecting...");
			proxyClient = null
		}
		stop();
		if (!stoppedByPlayer) log("Connection reset by 2b2t server. Reconnecting...");
		if (config.reconnect.onError) setTimeout(reconnect, 30000);
	});

	client.on('error', (err) => {
		if (proxyClient) {
			proxyClient.end(`Connection error by 2b2t server.\n Error message: ${err}\nReconnecting...`);
			proxyClient = null
		}
		stop();
		log(`Connection error by 2b2t server. Error message: ${err} Reconnecting...`);
		if (config.reconnect.onError) {
			setTimeout(reconnect, 30000);
		}
	});

	server = mc.createServer({ // create a server for us to connect to
		'online-mode': config.whitelist,
		encryption: true,
		host: '0.0.0.0',
		port: config.ports.minecraft,
		version: config.MCversion,
		'max-players': maxPlayers = 1
	});

	server.on('login', (newProxyClient) => { // handle login
		if(config.whitelist && client.uuid !== newProxyClient.uuid) {
			newProxyClient.end("not whitelisted!\nYou need to use the same account as 2b2w or turn the whitelist off");
			return;
		}
		newProxyClient.on('packet', (data, meta, rawData) => { // redirect everything we do to 2b2t
			filterPacketAndSend(rawData, meta, client);
		});
		cachePackets.join(newProxyClient);
		proxyClient = newProxyClient;
	});
}


function log(logmsg) {
	if (config.logging) {
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
	mc.ping({host: config.minecraftserver.hostname, port: config.minecraftserver.port}, (err) => {
		if(err) setTimeout(reconnectLoop, 3000);
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
	if (config.discordBot) dc.user.setActivity(string);
}

//the discordBot part starts here.
if (config.discordBot) {
	var dc = new discord.Client()
	dc.on('ready', () => {
		dc.user.setActivity("Queue is stopped.");
		fs.readFile(save, "utf8", (err, id) => {
			if(!err) dc.users.fetch(id).then(user => {
				dcUser = user;
			});
		});
	});

	dc.on('message', msg => {
		if (msg.author.username !== dc.user.username) {
			userInput(msg.content, true, msg);
			if (dcUser == null || msg.author.id !== dcUser.id) {
				fs.writeFile(save, msg.author.id, function (err) {
					if (err) {
						throw err;
					}
				});
			}
			dcUser = msg.author;
		}
	});

	dc.login(discordBotToken);
}

function userInput(cmd, DiscordOrigin, discordMsg) {
	 cmd = cmd.toLowerCase();
	
	switch (cmd) {
		case "start":
			startQueuing();
			msg(DiscordOrigin, discordMsg, "Queue", "Queue is starting up");
			break;
		case "update":
			switch (doing) {
				case "queue":
					if (DiscordOrigin) discordMsg.channel.send({
						embed: {
							color: 3447003,
							author: {
								name: dc.user.username,
								icon_url: dc.user.avatarURL
							},
							title: "2bored2wait discord bridge",
							description: "Start and stop the queue from discord!",
							fields: [{
								name: "Position",
								value: `You are in position **${webserver.queuePlace}**.`
							},
								{
									name: "ETA",
									value: `Estimated time until login: **${webserver.ETA}**`
								}
							],
							timestamp: new Date(),
							footer: {
								icon_url: dc.user.avatarURL,
								text: "Author: Surprisejedi"
							}
						}
					});
					else console.log("Position: " + webserver.queuePlace + "  Estimated time until login: " + webserver.ETA);
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
			}
			else msg(DiscordOrigin, discordMsg, "Error", "Unknown command");
	}
}

function stopMsg(discordOrigin, discordMsg, stoppedThing) {
	msg(discordOrigin, discordMsg, stoppedThing, stoppedThing + " is **stopped**");
	activity(stoppedThing + " is stopped.");
}

function msg(discordOrigin, msg, title, content) {
	if(discordOrigin) sendDiscordMsg(msg.channel, title, content);
	else console.log(content);
}

function sendDiscordMsg(channel, title, content) {
	channel.send({
		embed: {
			color: 3447003,
			author: {
				name: dc.user.username,
				icon_url: dc.user.avatarURL
			},
			fields: [{
				name: title,
				value: content
			}
			],
			timestamp: new Date(),
			footer: {
				icon_url: dc.user.avatarURL,
				text: "Author: MrGeorgen"
			}
		}
	});
}

function timeStringtoDateTime(time) {
	starttimestring = time.split(" ");
	starttimestring = starttimestring[1];
	let starttime = starttimestring.split(":");
	let startdt = DateTime.local().set({hour: starttime[0], minute: starttime[1], second: 0, millisecond: 0});
	if (startdt.toMillis() < DateTime.local().toMillis()) startdt = startdt.plus({days: 1});
	return startdt;
}

function calcTime(msg) {
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
		});
	}, 60000);

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
	if(config.joinOnStart) setTimeout(startQueuing, 1000);
}

function getWaitTime(queueLength, queuePos) {
	let b = everpolate.linear(queueLength, queueData.place, queueData.factor)[0];
	return Math.log((queuePos + c)/(queueLength + c)) / Math.log(b); // see issue 141
}
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
