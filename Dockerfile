FROM node:alpine

LABEL mantainer="mrgeorgen"
LABEL name="2bored2wait"

# copy application

WORKDIR "/srv/app"

COPY . "/srv/app"

# install requirements
RUN apk add --no-cache git;\
npm install;\
apk del --no-cache git || true


# exposing 8080 (webui), 25566 (mc proxy)
EXPOSE 8080/tcp
EXPOSE 25566/tcp
EXPOSE 25566/udp

# run container
CMD /srv/app/replace_config.sh && /srv/app/replace_credentials.sh && npm start
