# 2bored2wait
A proxy to wait out 2b2t.org's way too long queue.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/themoonisacheese?locale.x=fr_FR)

# How to install
1. Download and install node.js version 14 or above and git. You need git even if you download the repository as zip because it is to install the dependencies via npm. On non-windows platforms, you also need npm.
2. Download this repository with the green button (top right of this page). If you downloaded it as zip, unzip it.
3. Open a terminal and navigate to the folder you downloaded it in.
4. Run `npm install`
5. Copy config.json.example and name it config.json. Replace DISCORDBOT_FLAG and WEBSERVER_FLAG with true or false to your liking, then replace MINECRAFT_PROXY_PORT and WEB_UI_PORT with valid ports. Edit other values to your preference.
6. For trust reasons, this tool does not update automatically. Check back here once in a while to see if there are any updates.

# How to use
1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Run `npm start`
3. It will now ask for your Minecraft email and password. If you are using the discord bot you need to add your token. Then answer Y or N if you want to save your Minecraft email, password. If you answer N you will need to re-enter your Minecraft login information into the console each time you start the program.
4. Now open a browser and navigate to http://localhost: your port here.
5. Press the "Start queuing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
6. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`.
7. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

# Commands
All commands can be used through discord or the cli.
- `start` will start the queue. It takes between 15-30 seconds for the bot to update with the queue position.
- `start 14:00` will start at 2pm.
- `play 8:00` will try to calculate the right time to join so you can play at 8:00
- `update` will send an update to the current channel with your position and ETA.
- `stop` will stop the queue.

# Video guide
Here's a video guide on how to install and use 2b2w: https://www.youtube.com/watch?v=oWeCmZNYAW4 

# Docker usage guide (if you know how to use docker)
1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Edit docker-compose.yml and start the container
```
docker-compose up -d
```
3. Open a browser and navigate to http://localhost, attach to the container, or open a chat dialog with the discord bot
4. Press the "Start queuing" button/message the bot or cli "start"
5. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`.
6. After you log off, stop the 2bored2wait queue or your account will stay logged in on the server. You can reconnect to localhost in case you disconnected by accident.

## Additional configuration

If you want to change the configuration you will have to mount config.json manually, you can also mount secrets.json manually if you don't want your credentials in the bash history

To access logs you can just do
```
docker logs 2bored2wait
```

You can also easily change which port to map from the docker-compose, for example, if you want your server reachable on port 25000 instead of the default 25565 and your webserver on port 8080 you can change these varibles in the docker-compose
```
      ports:
         - "8080:8080"
         - "25000:25566"
```


# Docker build guide
1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Clone the repo
3. run `./gen_dockerignore.sh` to generate the .dockerignore
4. `docker build -t 2bored2wait .` to build the image.
5. Once the image has built, you can start it with:
```
docker run --name 2bored2wait -d -p 80:8080 -p 25565:25566 -e MOJANG_USERNAME="user@domain.com" -e MOJANG_PASSWORD="myverysecretpassword" -e BOT_TOKEN="mydiscordbottoken" -e DISCORD_BOT="true" -e WEBSERVER="true" -e MINECRAFT_PORT=25566 -e WEBUI_PORT=8080 2bored2wait
```
** Remember to change user@domain.com and myverysecretpassword with your actual Minecraft credentials, as well as mydiscordbottoken with your actual Discord Bot Token **

6. Open a browser and navigate to http://localhost
7. Press the "Start queuing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
8. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`.
9. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

If you want to change the configuration you will have to mount config.json manually, you can also mount secrets.json manually if you don't want your credentials in the bash history.

All additional configurations from the Docker usage guide apply here as well.

## Tests
- Run NPM test to run test.js

# ETA

2b2w does not show ETA from 2b2t. the ETA is calculated based on position in the queue. This results in better ETA most of the time.

# Known issues
- Starting the queue will revoke your Minecraft token. this means that you will not be able to join normal Minecraft servers until you restart the game
- If you connect after the queue is finished or reconnect the proxy will send cached chunk data. Otherwise you would fly in an empty world. Other data such as  entities and your player inventory are not cached and will not be displayed correctly. You can move out of render distance (I find going through a nether portal works best) and return to fix this issue. Sometimes the client renders a cached chunk with a blank texture.
