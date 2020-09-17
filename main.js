// imports
const jsonminify = require("node-json-minify"); // to remove comments from the config.json, because normally comments in json are not allowed
const fs = require('fs');
const mc = require('minecraft-protocol'); // to handle minecraft login session
const webserver = require('./webserver.js'); // to serve the webserver
const opn = require('opn'); //to open a browser window
var config = JSON.parse(jsonminify(fs.readFileSync("./config.json", "utf8"))); // read the config
const discord = require('discord.js');
const {DateTime} = require("luxon");
const https = require("https");
const prompt = require("prompt");
const mc_util = require('minecraft-server-util');
const tokens = require('prismarine-tokens');
const save = "./saveid"
var mc_username;
var mc_password;
var secrets;

if(fs.existsSync("./secrets.json")) {
	secrets = require('./secrets.json');
	mc_username = secrets.username;
	mc_password = secrets.password;
}else {
	config.discordBot = false;
	const rl = require("readline").createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question("Username: ", function(username) {
		rl.question("Password: ", function(userpassword) {
			mc_username = username;
			mc_password = userpassword;
			for(var i = 0; i < process.stdout.getWindowSize()[1]; i++) {
				console.log('\n');  // i know it's not the best way to clear a console but i don't know how to do it
			}
		});
	});
}

webserver.createServer(config.ports.web); // create the webserver
webserver.password = config.password
var stoppedByPlayer = false;
var timedStart;
var lastQueuePlace;
var chunkData = [];
var notisend = false;
var loginpacket;
var id;
var totalWaitTime;
var starttimestring;
var playTime;
var options;
var doing;
var calcInterval;
var authInterval;
var reconnectinterval;
var antiAntiAFk;
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

//comand prompt
prompt.start();
cmdInput();

options = {
	host: config.minecraftserver.hostname,
	port: config.minecraftserver.port,
	version: config.minecraftserver.version
}

function cmdInput() {
	prompt.get("cmd", function (err, result) {
		userInput(result.cmd, false);
		cmdInput();
	});
}

// function to disconnect from the server
function stop() {
	webserver.isInQueue = false;
	webserver.queuePlace = "None";
	webserver.ETA = "None";
	client.end(); // disconnect
	if (proxyClient) {
		proxyClient.end("Stopped the proxy."); // boot the player from the server
	}
	server.close(); // close the server
	activity("Queue is stopped.");
}

// function to start the whole thing
function startQueuing() {
	doing = "auth";
	if (config.minecraftserver.onlinemode) {
		options.username = mc_username;
		options.password = mc_password;
		options.tokensLocation = "./minecraft_token.json"
		options.tokensDebug = true;
		tokens.use(options, function (_err, _opts) {

			if (_err) throw _err;

			client = mc.createClient(_opts);
			join();
		});
	} else {
		options.username = config.minecraftserver.username;
		client = mc.createClient(options);// connect to 2b2t
		join();
	}
}

function join() {
	let ETAhour;
	let timepassed;
	doing = "queue"
	webserver.isInQueue = true;
	activity("Starting the queue...");
	let finishedQueue = false;
	antiAntiAfkmsg();
	client.on("packet", (data, meta) => { // each time 2b2t sends a packet
		switch (meta.name) {
			case "map_chunk":
				chunkData.push(data);
				break;
			case "playerlist_header":
				if (!finishedQueue && config.minecraftserver.hostname === "2b2t.org") { // if the packet contains the player list, we can use it to see our place in the queue
					let headermessage = JSON.parse(data.header);
					let positioninqueue = headermessage.text.split("\n")[5].substring(25);
					webserver.queuePlace = positioninqueue; // update info on the web page
					if (webserver.queuePlace !== "None" && lastQueuePlace !== webserver.queuePlace) {
						if (!totalWaitTime) {
							totalWaitTime = Math.pow(positioninqueue / 35.4, 2 / 3);
						}
						timepassed = -Math.pow(positioninqueue / 35.4, 2 / 3) + totalWaitTime;
						ETAhour = totalWaitTime - timepassed;
						webserver.ETA = Math.floor(ETAhour) + "h " + Math.round((ETAhour % 1) * 60) + "m";
						server.motd = `Place in queue: ${positioninqueue} ETA: ${webserver.ETA}`; // set the MOTD because why not
						activity("Pos: " + webserver.queuePlace + " ETA: " + webserver.ETA); //set the Discord Activity
						log("Position in Queue: " + webserver.queuePlace)
						if (config.notification.enabled && webserver.queuePlace <= config.notification.queuePlace && !notisend && config.discordBot && id != null) {
							dc.fetchUser(id, false).then(user => {
								sendDiscordMsg(user.dmChannel, "Queue", "The queue is almost finished. You are in Position: " + webserver.queuePlace);
							})
							notisend = true;
						}
					}
					lastQueuePlace = webserver.queuePlace;
				}
				break;
			case "chat":
				if (finishedQueue === false) { // we can know if we're about to finish the queue by reading the chat message
					// we need to know if we finished the queue otherwise we crash when we're done, because the queue info is no longer in packets the server sends us.
					let chatMessage = JSON.parse(data.message);
					if (chatMessage.text && chatMessage.text === "Connecting to the server...") {
						if (webserver.restartQueue && proxyClient == null) { //if we have no client connected and we should restart
							stop();
						} else {
							finishedQueue = true;
							webserver.queuePlace = "FINISHED";
							webserver.ETA = "NOW";
							activity("Queue is finished")
						}
					}
				}
				break;
			case "respawn":
				Object.assign(loginpacket, data);
				chunkData = [];
				break;
			case "login":
				loginpacket = data;
				break;
			case "game_state_change":
				loginpacket.gameMode = data.gameMode;
				break;
		}
		if (proxyClient) { // if we are connected to the proxy, forward the packet we recieved to our game.
			filterPacketAndSend(data, meta, proxyClient);
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
		if (config.reconnect.onError) setTimeout(reconnect, 6000);
	});

	client.on('error', (err) => {
		if (proxyClient) {
			proxyClient.end(`Connection error by 2b2t server.\n Error message: ${err}\nReconnecting...`);
			proxyClient = null
		}
		stop();
		log(`Connection error by 2b2t server. Error message: ${err} Reconnecting...`);
		if (config.reconnect.onError) {
			if (err == "Error: Invalid credentials. Invalid username or password.") setTimeout(reconnect, 60000);
			else setTimeout(reconnect, 4000);
		}
	});

	server = mc.createServer({ // create a server for us to connect to
		'online-mode': false,
		encryption: true,
		host: '0.0.0.0',
		port: config.ports.minecraft,
		version: config.MCversion,
		'max-players': maxPlayers = 1
	});

	server.on('login', (newProxyClient) => { // handle login
		setTimeout(sendChunks, 1000)
		if (config.antiAntiAFK) clearInterval(antiAntiAFk);
		newProxyClient.write('login', loginpacket);
		newProxyClient.write('position', {
			x: 0,
			y: 1.62,
			z: 0,
			yaw: 0,
			pitch: 0,
			flags: 0x00
		});

		newProxyClient.on('packet', (data, meta) => { // redirect everything we do to 2b2t
			let chunkPos = {};
			if (meta.name === "position") {
				chunkPos.x = round(data.x / 16);
				chunkPos.z = round(data.z / 16);
				if (chunkPos.z !== chunkPos.lx || chunkPos.x !== chunkPos.lx) {

					for (let i = 0; i < chunkData.length; i++) {
						if (chunkData[i].x < chunkPos.x - config.minecraftserver.renderDistance || chunkData[i].x > chunkPos + config.minecraftserver.renderDistance || chunkData[i].z < chunkPos.z - config.minecraftserver.renderDistance || chunkData[i] > chunkPos.z + config.minecraftserver.renderDistance) { //if a cached chunk is outside of the render distance
							chunkData.splice(i, 1); // we delete it.
						}
					}
				}
				chunkPos.lx = chunkPos.x;
				chunkPos.lz = chunkPos.z;
			}
			filterPacketAndSend(data, meta, client);
		});
		newProxyClient.on("end", () => {
			setTimeout(function(){
				if (webserver.isInQueue) antiAntiAfkmsg();
			},1000);
		})

		proxyClient = newProxyClient;
	});
}

function sendChunks() {
	for (let i = 0; i < chunkData.length; i++) {
		proxyClient.write("map_chunk", chunkData[i]);
	}
}

function log(logmsg) {
	if (config.logging) {
		fs.appendFile('../2smart2wait.log', DateTime.local().toLocaleString({
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}) + "	" + logmsg + "\n", err => {
			if (err) console.error(err)
		})
		console.log(logmsg);
	}
}

function reconnect() {
	doing = "reconnect"
	if (stoppedByPlayer) stoppedByPlayer = false;
	else reconnectLoop();
}

function reconnectLoop() {
	mc_util.ping(config.minecraftserver.hostname, config.minecraftserver.port)
		.then((response) => {
			startQueuing();
		})
		.catch((error) => {
			setTimeout(reconnectLoop, 3000);
		});
}

//function to filter out some packets that would make us disconnect otherwise.
//this is where you could filter out packets with sign data to prevent chunk bans.
function filterPacketAndSend(data, meta, dest) {
	if (meta.name !== "keep_alive" && meta.name !== "update_time") { //keep alive packets are handled by the client we created, so if we were to forward them, the minecraft client would respond too and the server would kick us for responding twice.
		dest.write(meta.name, data);
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
	fs.access(save, error => {
		fs.readFile(save, "utf8", (err, data) => {
			if (err) log(err)
			id = data;
		});
	});
	var dc = new discord.Client()
	dc.on('ready', () => {
		dc.user.setActivity("Queue is stopped.");
	});

	dc.on('message', msg => {
		if (msg.author.username !== dc.user.username) {
			userInput(msg.content, true, msg);
			if (msg.author.id !== id) {
				fs.writeFile(save, msg.author.id, function (err) {
					if (err) {
						log(err);
					}
				});
			}
			id = msg.author.id
		}
	});

	dc.login(secrets.BotToken);
}

function userInput(cmd, DiscordOrigin, discordMsg) {
	switch (cmd) {
		case "start":
			startQueuing();
			if (DiscordOrigin) sendDiscordMsg(discordMsg.channel, "Queue", "Queue is starting up");
			else console.log("Queue is starting up.")
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
					let timerMsg = "Timer is set to " + starttimestring;
					if (DiscordOrigin) sendDiscordMsg(discordMsg.channel, "Timer", timerMsg);
					else console.log(timerMsg);
					break;
				case "reconnect":
					let reconnectMsg = "2bt is currently offline. Trying to reconnect";
					if (DiscordOrigin) sendDiscordMsg(discordMsg.channel, "Reconnecting", reconnectMsg);
					else console.log(reconnectMsg);
					break;
				case "auth":
					let authMsg = "Authentication";
					if (DiscordOrigin) sendDiscordMsg(discordMsg.channel, authMsg, authMsg);
					else console.log(authMsg);
					break;
				case "calcTime":
					let calcMsg = "Calculating the time, so you can paly at " + starttimestring
					if (DiscordOrigin) sendDiscordMsg(discordMsg.channel, "calculating time", calcMsg);
					console.log(calcMsg);
					break;
			}
			break;
		case "stop":
			switch (doing) {
				case "queue":
					stopQueing();
					if (DiscordOrigin) stopMsg(DiscordOrigin, discordMsg.channel, "Queue");
					else console.log("The queue is stopped");
					break;
				case "timedStart":
					clearTimeout(timedStart);
					if (DiscordOrigin) stopMsg(DiscordOrigin, discordMsg.channel, "Timer");
					else console.log("The timer is stopped");
					break;
				case "reconnect":
					clearInterval(reconnectinterval);
					if (DiscordOrigin) stopMsg(DiscordOrigin, discordMsg.channel, "Reconnecting");
					else console.log("Reconnecting is stoppd");
					break;
				case "auth":
					clearInterval(authInterval);
					if (DiscordOrigin) stopMsg(DiscordOrigin, discordMsg.channel, "Authentication");
					else console.log("Authentication is stopped");
					break;
				case "calcTime":
					clearInterval(calcInterval);
					if (DiscordOrigin) stopMsg(DiscordOrigin, discordMsg.channel, "Time calculation");
					else console.log("Time calculation is stopped");
					break;
			}
			break;
		default:
			if (/start (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd)) {
				doing = "timedStart"
				timedStart = setTimeout(startQueuing, timeStringtoDateTime(cmd).toMillis() - DateTime.local().toMillis());
				activity("Starting at " + starttimestring);
				if (DiscordOrigin) {
					sendDiscordMsg(discordMsg.channel, "Timer", "Queue is starting at " + starttimestring);
				} else console.log("Queue is starting at " + starttimestring);
			} else if (/^play (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd)) {
				timeStringtoDateTime(cmd);
				calcTime(cmd);
				let output = "The perfect time to start the will be calculated, so you play at " + starttimestring;
				if (DiscordOrigin) sendDiscordMsg(discordMsg.channel, "time calculator", output);
				else console.log(output);
				activity("You can play at " + starttimestring);
			} else if (DiscordOrigin) discordMsg.channel.send("Error: Unknown command");
			else console.error("Unknown command")
	}
}

function stopMsg(discordOrigin, channel, stoppedThing) {
	if (discordOrigin) sendDiscordMsg(channel, stoppedThing, stoppedThing + " is **stopped**");
	else console.log(stoppedThing + " is stopped");
}

function sendDiscordMsg(channel, titel, content) {
	channel.send({
		embed: {
			color: 3447003,
			author: {
				name: dc.user.username,
				icon_url: dc.user.avatarURL
			},
			fields: [{
				name: titel,
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
	calcInterval = setInterval(function () {
		https.get("https://2b2t.io/api/queue", (resp) => {
			let data = '';
			resp.on('data', (chunk) => {
				data += chunk;
			});
			resp.on("end", () => {
				data = JSON.parse(data);
				totalWaitTime = Math.pow(data[0][1] / 35.4, 2 / 3); // data[0][1] is the current queue length
				playTime = timeStringtoDateTime(msg);
				if (playTime.toSeconds() - DateTime.local().toSeconds() < totalWaitTime * 3600) {
					startQueuing();
					clearInterval(calcInterval);
				}
			});
		});
	}, 60000);

}

function antiAntiAfkmsg() {
	if (config.antiAntiAFK) antiAntiAFk = setInterval(function () {
		client.write("chat", { message: "{\"text\":\">\"}", position: 1 })
	}, 50000)
}

function stopQueing() {
	stoppedByPlayer = true;
	stop();
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
