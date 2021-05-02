#!/bin/sh

# Author: dsetareh

# script used to set the config values in the docker image

# if file already exists it means it has been mounted, I'll use that one

if [ ! -f /srv/app/config/local.json ]; then

# create config file
cp config/docker.json /srv/app/config/default.json

# insert config values into file from env
sed -i 's/"DISCORDBOT_FLAG"/'"$DISCORD_BOT"'/g' /srv/app/config/default.json
sed -i 's/"WEBSERVER_FLAG"/'"$WEBSERVER"'/g' /srv/app/config/default.json
sed -i 's/"MINECRAFT_PROXY_PORT"/'"$MINECRAFT_PORT"'/g' /srv/app/config/default.json
sed -i 's/"WEB_UI_PORT"/'"$WEBUI_PORT"'/g' /srv/app/config/default.json

fi
