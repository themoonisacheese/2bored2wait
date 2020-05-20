// to make sure webserver works correctly
process.chdir("2bored2wait/")

// reqs
var http = require("http");
var queuing = require('./2bored2wait/main.js');
var auth = require('./auth.json');
var sleep = require('sleep');
var Discord = require('discord.js');

global.queueData = "";


function update() {
    http.get("http://localhost/update", (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on("end", () => {
            queueData = JSON.parse(data);
            console.log(`Recieved data: ${queueData.place}`)
            if (queueData.place === "None" || queueData.place === "undefined") {
                queueData = "Please allow a moment for the data to update"
            }
        });
    }).on("error", (err) => {
        queueData = "error"
    });
    setTimeout(update, 5 * 1000);
    setTimeout(timedDiscordUpdate, 30 * 1000);
}

function setDiscordActivity(string) {
    client.user.setActivity(string, {
            type: ""
        })
        .then(presence => console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`))
        .catch(console.error);
}

function timedDiscordUpdate() {
    setDiscordActivity("Queue Position: " + queueData.place)
}
// Configure logger settings

var client = new Discord.Client()

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
    setDiscordActivity("Queue is stopped.")
})

client.on('message', msg => {

    if (msg.content === 'update') {
        msg.channel.send({
            embed: {
                color: 3447003,
                author: {
                    name: client.user.username,
                    icon_url: client.user.avatarURL
                },
                title: "2bored2wait discord bridge",
                //url: "http://google.com",
                description: "Start and stop the queue from discord!",
                fields: [{
                        name: "Position",
                        value: `You are in position **${queueData.place}**.`
                    },
                    {
                        name: "ETA",
                        value: `Estimated time until login: **${queueData.ETA}**`
                    }
                ],
                timestamp: new Date(),
                footer: {
                    icon_url: client.user.avatarURL,
                    text: "Author: Surprisejedi"
                }
            }
        });
    }
    if (msg.content === "start") {
        queuing.startQueue()
        msg.channel.send({
            embed: {
                color: 3447003,
                author: {
                    name: client.user.username,
                    icon_url: client.user.avatarURL
                },
                fields: [{
                        name: "Queue",
                        value: `Queue is starting up. Allow 15 seconds to update.`
                    }
                ],
                timestamp: new Date(),
                footer: {
                    icon_url: client.user.avatarURL,
                    text: "Author: Surprisejedi"
                }
            }
        });
        setDiscordActivity("Starting queue.")
        setTimeout(update, 5 * 1000);
    }
    if (msg.content === "stop") {
        setDiscordActivity("Queue is stopped.")
        msg.channel.send({
            embed: {
                color: 3447003,
                author: {
                    name: client.user.username,
                    icon_url: client.user.avatarURL
                },
                fields: [{
                        name: "Queue",
                        value: `Queue is **stopped**.`
                    }
                ],
                timestamp: new Date(),
                footer: {
                    icon_url: client.user.avatarURL,
                    text: "Author: Surprisejedi"
                }
            }
        });
        queuing.stop()
    }
})

client.login(auth.token)
