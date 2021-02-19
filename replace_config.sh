#!/bin/sh

# Author: dsetareh

# script used to set the config values in the docker image

# if file already exists it means it has been mounted, I'll use that one

if [ ! -f /srv/app/config.json ]; then

# create config file
cp config.json.example config.json

# insert config values into file from env
sed -i 's/DISCORDBOT_FLAG/'"$DISCORD_BOT"'/g' config.json
sed -i 's/WEBSERVER_FLAG/'"$WEBSERVER"'/g' config.json
sed -i 's/MINECRAFT_PROXY_PORT/'"$MINECRAFT_PORT"'/g' config.json
sed -i 's/WEB_UI_PORT/'"$WEBUI_PORT"'/g' config.json

fi
