#!/bin/sh

# Author: edofullo

# script used to set the credentials in the docker image

# if file already exists it means it has been mounted, I'll use that one

if [ ! -f /srv/app/secrets.json ]; then

    # create secrets file
    cp config/secrets.json.example config/secrets.json

    # insert credentials into file from env
    sed -i 's/example@hotmail.com/'"$MOJANG_USERNAME"'/g' config/secrets.json
    sed -i 's/password123/'"$MOJANG_PASSWORD"'/g' config/secrets.json
    sed -i 's/DiscordBotToken/'"$BOT_TOKEN"'/g' config/secrets.json

fi
