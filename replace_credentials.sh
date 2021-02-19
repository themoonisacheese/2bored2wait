#!/bin/sh

# Author: edofullo

# script used to set the credentials in the docker image

# if file already exists it means it has been mounted, I'll use that one

if [ ! -f /srv/app/secrets.json ]; then

    # create secrets file
    cp secrets.json.example secrets.json

    # insert credentials into file from env
    sed -i 's/example@hotmail.com/'"$MOJANG_USERNAME"'/g' secrets.json
    sed -i 's/password123/'"$MOJANG_PASSWORD"'/g' secrets.json
    sed -i 's/DiscordBotToken/'"$BOT_TOKEN"'/g' secrets.json

fi
