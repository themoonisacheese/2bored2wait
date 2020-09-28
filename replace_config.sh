#!/bin/bash

# Author: dsetareh

# script used to set the config values in the docker image

# create config file
cp config.json.example config.json

# insert config values into file from env
sed -i 's/DISCORDBOT_FLAG/'"$DISCORD_BOT"'/g' config.json
sed -i 's/WEBSERVER_FLAG/'"$WEBSERVER"'/g' config.json
sed -i 's/MINECRAFT_PROXY_PORT/'"$MINECRAFT_PORT"'/g' config.json
sed -i 's/WEB_UI_PORT/'"$WEBUI_PORT"'/g' config.json
