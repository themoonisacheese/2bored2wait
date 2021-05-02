import opn from 'open';
import mc from 'minecraft-protocol';
import discord from 'discord.js';
import https from 'https';
import * as mcproxy from 'mcproxy';
import fs from 'fs';
import rl from 'readline';
const webserver = require('../webserver/webserver.js');
import { DateTime } from 'luxon';
//@ts-ignore
import everpolate from 'everpolate';

const c = 150;

let [state, starttimestring, finishtimestring] = [] as string[];
//@ts-ignore
let config: typeof import('../config/default.json') = (function () {
  if (process.env['test'] === 'true') return JSON.parse(fs.readFileSync('config/test.json', 'utf-8'));
  try {
    //@ts-ignore
    return JSON.parse(fs.readFileSync('config/local.json', 'utf-8').replace(/\/\/.*?\n/g, ''));
  } catch (e) {
    if (e instanceof SyntaxError) console.warn(e.message);
  }
  try {
    //@ts-ignore
    return JSON.parse(fs.readFileSync('config/default.json', 'utf-8').replace(/\/\/.*?\n/g, ''));
  } catch (e) {
    console.error(`${e}\nPlease keep the default.json config file if you don't supply your own local.json file`);
    process.exit(1);
  }
})();

//@ts-ignore
let queueData: typeof import('../config/queue.json') = JSON.parse(fs.readFileSync('./config/queue.json', 'utf-8'));

let timedStart: NodeJS.Timeout;
let dc: discord.Client | undefined;
let calcInterval: NodeJS.Timeout;
let reconnectTimeout: NodeJS.Timeout;
let reconnectTimeoutStartTime: DateTime;
let conn: mcproxy.Conn | null;
let client: mc.Client;
let proxyClient: mc.Client | null;
let dcUser: discord.User | undefined;
let server: mc.Server | null;
let finishedQueue = !config.minecraftserver.is2b2t;
let queueStartPlace: number;
let queueStartTime: DateTime;
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
  if (config.openBrowserOnStart) opn('http://localhost:' + webPort); //open a browser window
}

const rlIf = rl.createInterface({
  input: process.stdin,
  output: process.stdout,
});
async function question(text: string): Promise<string> {
  return new Promise((resolve) => rlIf.question(text, resolve));
}
(async () => {
  let askToSave = false;
  if (config.minecraftserver.onlinemode && (config.account.username === '' || config.account.password === '') && config.account.profilesFolder === '') {
    askToSave = true;
    if ((await question('Do you want to use launcher account data? (If not, your password will be stored in plaintext if you decide to save) [y|N]: ')).toLowerCase() === 'y') {
      config.account.username = await question('Username (NOT your email!): ');
      config.account.profilesFolder = await question('Path to your Minecraft data folder, leave blank for the default path []:');
      config.account.profilesFolder = config.account.profilesFolder === '' ? (process.env.APPDATA ? `${process.env.APPDATA}` : process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support/minecraft` : `${process.env.HOME}/.minecraft`) : config.account.profilesFolder;
    } else {
      config.account.accountType = (await question('Account type, mojang (1) or microsoft (2) [1]: ')) === '2' ? 'microsoft' : 'mojang';
      config.account.username = await question('Email: ');
      config.account.password = await question('Password: ');
    }
  }
  if (config.discordBot && config.BotToken === '') {
    askToSave = true;
    config.BotToken = await question('BotToken, leave blank if not using discord []: ');
    config.discordBot = config.BotToken !== '';
  }
  if (askToSave) {
    if ((await question('Save changes to config file for later use? [y|N]: ')).toLowerCase() === 'y') fs.writeFileSync('./config/local.json', JSON.stringify(config, null, 2));
    console.clear();
  }
  (async () => {
    console.log(config.discordBot);
    if (config.discordBot) {
      dc = new discord.Client();
      dc.login(config.BotToken);
      dc.on('ready', () => {
        dc?.user?.setActivity('Queue is stopped.');
        fs.readFile('./saveid', 'utf8', (err, id) => {
          if (!err)
            dc?.users.fetch(id).then((user) => {
              dcUser = user;
            });
        });
      });

      dc.on('message', async (msg) => {
        if (msg.author.username !== dc?.user?.username) {
          sendDiscordMsg(dcUser as discord.User, ...((await userInput(msg.content)) as [string, string]));
          if (dcUser == null || msg.author.id !== dcUser.id) {
            fs.writeFile('./saveid', msg.author.id, function (err) {
              if (err) throw err;
            });
          }
          dcUser = msg.author;
        }
      });
      log('Started discord bot.');
    }
  })();
  console.log(`enter commands after the $, for reference enter "help" or visit https://github.com/themoonisacheese/2bored2wait#commands`);
  if (config.joinOnStart) {
    logActivity('Starting Client');
    setTimeout(startQueuing, 1000);
  } else {
    console.log(`you don't have joining on start enabled, don't forget to start queuing!`);
  }
  while (true) console.log((await userInput(await question('$ ')))[1]);
})();

async function userInput(cmd: string): Promise<string[]> {
  function getStateMessage(stopthat: boolean): string[] {
    switch (state) {
      case 'queue':
        if (stopthat) stopQueuing();
        return ['Queuing', webserver.queuePlace === 'None' ? `Waiting in Queue, Server hasn't sent current position yet` : `Position ${webserver.queuePlace} Estimated time until login: ${webserver.ETA}`];
      case 'timedStart':
        if (stopthat) clearTimeout(timedStart);
        return ['Timed Start', `Starttime is set to ${starttimestring}`];
      case 'reconnect':
        if (stopthat) {
          stopQueuing();
          clearTimeout(reconnectTimeout);
        }
        return ['Waiting to reconnect', `There was an issue connecting. Trying again in ${reconnectTimeoutStartTime.diffNow().seconds} seconds`];
      case 'auth':
        if (stopthat) stopQueuing();
        return ['Authenticating', 'Logging in'];
      case 'calcTime':
        if (stopthat) clearTimeout(calcInterval);
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
      if ((await question('Are you really sure you want to quit? Your queue progress will be lost. [y|N]: ')).toLowerCase() === 'y') process.exit(0);
      return ['Cancelled', 'Not quitting.'];
    default:
      if (/start (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd)) {
        if (!!server) return ['Error', 'if you are really sure you want to stop queuing now, first stop the program then try again'];
        state = 'timedStart';
        starttimestring = cmd.split(' ')[1];
        timedStart = setTimeout(startQueuing, timeStringtoDateTime(cmd).toMillis() - DateTime.local().toMillis());
        activity(`Starting at ${starttimestring}`);
        return ['Timer', `Queue is starting at ${starttimestring}`];
      } else if (/^play (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd)) {
        finishtimestring = cmd.split(' ')[1];
        calcTime(cmd);
        activity('You can play at ' + finishtimestring);
        return ['Time calculating', `The perfect time to start the queue will be calculated, so you can play at ${finishtimestring}`];
      } else return ['Error', 'Unknown Command'];
  }
}
async function startQueuing() {
  if (!!conn) {
    console.log('already queuing, stop then start if you really want to restart, current state:' + state);
    return;
  }
  state = 'auth';
  conn = new mcproxy.Conn({
    username: config.minecraftserver.onlinemode ? config.account.username : config.minecraftserver.username,
    password: config.account.password, //@ts-ignore
    profilesFolder: config.account.profilesFolder,
    auth: config.account.accountType as 'mojang' | 'microsoft' | undefined,
    host: config.minecraftserver.hostname,
    port: config.minecraftserver.port,
    version: config.minecraftserver.version,
  });
  client = conn.bot._client;
  join();
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
  client?.end(''); // disconnect
  conn = null;
  if (proxyClient) {
    proxyClient.end('Stopped the proxy.'); // boot the player from the server
  }
  server?.close(); // close the server
  server = null;
}
function join() {
  state = 'auth';
  let positioninqueue: number | 'None' = 'None';
  let lastQueuePlace: number | 'None' = 'None';
  let notisend = false;
  webserver.isInQueue = true;
  activity('Starting the queue...');
  client.on('state', async (cstate) => {
    if (cstate === 'play') state = 'queue';
  });
  client.on('packet', async (data, meta) => {
    // each time 2b2t sends a packet
    switch (meta.name) {
      case 'playerlist_header':
        if (!finishedQueue && config.minecraftserver.is2b2t) {
          // if the packet contains the player list, we can use it to see our place in the queue
          let headermessage = JSON.parse(data.header);
          positioninqueue = 'None';
          try {
            positioninqueue = headermessage.text.split('\n')[5].substring(25);
          } catch (e) {
            if (e instanceof TypeError) console.log("Reading position in queue from tab failed! Is the queue empty, or the server isn't 2b2t?");
          }
          if (positioninqueue !== 'None') positioninqueue = Number(positioninqueue);
          webserver.queuePlace = positioninqueue; // update info on the web page
          if (lastQueuePlace === 'None' && positioninqueue !== 'None') {
            queueStartPlace = positioninqueue;
            queueStartTime = DateTime.local();
          }
          if (positioninqueue !== 'None' && lastQueuePlace !== positioninqueue) {
            let ETAmin = (getWaitTime(queueStartPlace, 0) - getWaitTime(queueStartPlace, positioninqueue)) / 60;
            webserver.ETA = Math.floor(ETAmin / 60) + 'h ' + Math.floor(ETAmin % 60) + 'm';
            logActivity(`P: ${positioninqueue} E: ${webserver.ETA}` + (config.userStatus ? ` - ${client.username ?? (config.minecraftserver.onlinemode ? config.account.username : config.minecraftserver.username)}` : ''));
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
          if (chatMessage?.text === 'Connecting to the server...') {
            if (config.expandQueueData) {
              queueData.place.push(queueStartPlace);
              let timeQueueTook = DateTime.local().toSeconds() - queueStartTime.toSeconds();
              let b = Math.pow((0 + c) / (queueStartPlace + c), 1 / timeQueueTook);
              queueData.factor.push(b);
              fs.writeFile('./config/queue.json', JSON.stringify(queueData), 'utf-8', () => {});
            }
            if (webserver.restartQueue && proxyClient == null) {
              //if we have no client connected and we should restart
              //? don't
              stop();
            } else {
              finishedQueue = true;
              webserver.queuePlace = 'FINISHED';
              webserver.ETA = 'NOW';
              logActivity('Queue is finished');
            }
          }
        }
        break;
    }
  });

  // set up actions in case we get disconnected.
  client.on('end', end);
  client.on('error', end);
  function end(err?: Error) {
    if (proxyClient) {
      proxyClient.end(`Connection reset by 2b2t server.${!!err ? `Error message: ${err}` : ''}\nReconnecting...`);
      proxyClient = null;
    }
    stop();
    if (!stoppedByPlayer && config.reconnect.onError) {
      log(`Connection reset by 2b2t server. Reconnecting in ${config.reconnect.timeout}ms...`);
      state = 'reconnect';
      reconnectTimeout = setTimeout(reconnect, config.reconnect.timeout);
      reconnectTimeoutStartTime = DateTime.now();
    }
  }

  server = mc.createServer({
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
    conn?.sendPackets(newProxyClient);
    conn?.link(newProxyClient);
    proxyClient = newProxyClient;
  });
}
function filterPacketAndSend(data: any, meta: mc.PacketMeta, dest: mc.Client) {
  if (meta.name !== 'keep_alive' && meta.name !== 'update_time') {
    //keep alive packets are handled by the client we created, so if we were to forward them, the minecraft client would respond too and the server would kick us for responding twice.
    dest.writeRaw(data);
  }
}
function logActivity(string: string) {
  if (config.userStatus) activity(string);
  if (server?.motd) server.motd = string.replace(/P:/, 'Place in Queue:').replace(/E:/, 'ETA:');
  log(string);
}
async function activity(string: string) {
  dc?.user?.setActivity(string);
}
function timeStringtoDateTime(time: string) {
  let starttime = time.split(' ')[1].split(':');
  let startdt = DateTime.local().set({ hour: Number(starttime[0]), minute: Number(starttime[1]), second: 0, millisecond: 0 });
  if (startdt.toMillis() < DateTime.local().toMillis()) startdt = startdt.plus({ days: 1 });
  return startdt;
}
async function calcTime(msg: string) {
  state = 'calcTime';
  calcInterval = setInterval(function () {
    https
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
          if (playTime.toSeconds() - DateTime.local().toSeconds() < waitTime) {
            startQueuing();
            if (calcInterval) clearInterval(calcInterval);
            console.log(waitTime);
          }
        });
      })
      .on('error', (err) => {
        log(String(err));
      });
  }, 60000);
}
function reconnect() {
  state = 'reconnect';
  if (stoppedByPlayer) stoppedByPlayer = false;
  else {
    logActivity('Reconnecting... ');
    reconnectLoop();
  }
}
function log(logmsg: string | Error) {
  if (config.logging) {
    fs.appendFile('2bored2wait.log', `${DateTime.local().toLocaleString({ hour: '2-digit', minute: '2-digit', hour12: false })}	${logmsg}\n`, (err) => {
      if (err) console.error(err);
    });
  }
  process.stdout.write(`\x1B[F\n${logmsg}\n$ ${rlIf.line}`);
}
async function sendDiscordMsg(channel: discord.User, title: string, content: string) {
  if (dc?.user)
    try {
      channel?.send({
        embed: {
          color: 3447003,
          author: {
            name: client?.username ?? (config.minecraftserver.onlinemode ? config.account.username : config.minecraftserver.username),
            icon_url: client.uuid ? `https://crafatar.com/avatars/${client.uuid}?size=128` : ((dc.user.avatarURL as unknown) as string),
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
    } catch (e) {
      log(e);
    }
}
function getWaitTime(queueLength: number, queuePos: number) {
  let b = everpolate.linear(queueLength, queueData.place, queueData.factor)[0];
  return Math.log((queuePos + c) / (queueLength + c)) / Math.log(b); // see issue 141
}

function reconnectLoop() {
  mc.ping({ host: config.minecraftserver.hostname, port: config.minecraftserver.port }, (err) => {
    if (err) {
      log(`Error on 2b2t's side: ${err.message}`);
      reconnectTimeout = setTimeout(reconnectLoop, 3000);
      reconnectTimeoutStartTime = DateTime.now();
    } else startQueuing();
  });
}
