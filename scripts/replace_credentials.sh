#!/bin/sh

# Author: edofullo

# script used to set the credentials in the docker image

# if file already exists it means it has been mounted, I'll use that one

if [ ! -f /srv/app/config/local.json ]; then

    if [ ! -f /srv/app/config/default.json ]; then
        sh ./scripts/replace_config.sh
    fi

    # create secrets file
    cp /srv/app/config/default.json /srv/app/config/local.json

    # insert credentials into file from env
    sed -i 's/example@hotmail.com/'"$MOJANG_USERNAME"'/g' /srv/app/config/local.json
    sed -i 's/password123/'"$MOJANG_PASSWORD"'/g' /srv/app/config/local.json
    sed -i 's/DiscordBotToken/'"$BOT_TOKEN"'/g' /srv/app/config/local.json

fi
