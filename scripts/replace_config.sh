#!/bin/bash

# Author: dsetareh

# script used to set the config values in the docker image

# if file already exists it means it has been mounted, I'll use that one

cd ..

if [ ! -f /srv/app/config/config.json ]; then

# create config file
cp config/config.json.example config/config.json

# insert config values into file from env
sed -i 's/DISCORDBOT_FLAG/'"$DISCORD_BOT"'/g' config/config.json
sed -i 's/WEBSERVER_FLAG/'"$WEBSERVER"'/g' config/config.json
sed -i 's/MINECRAFT_PROXY_PORT/'"$MINECRAFT_PORT"'/g' config/config.json
sed -i 's/WEB_UI_PORT/'"$WEBUI_PORT"'/g' config/config.json

fi
