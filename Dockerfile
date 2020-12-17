FROM node:alpine

LABEL mantainer="mrgeorgen"
LABEL name="2bored2wait"

# copy application

WORKDIR "/srv/app"

COPY . "/srv/app"

# install requirements
RUN apk --update add git && \
npm install && \
apk del git && \
rm -rf /var/lib/apt/lists/* && \
rm /var/cache/apk/*


# exposing 8080 (webui), 25566 (mc proxy)
EXPOSE 8080/tcp
EXPOSE 25566/tcp
EXPOSE 25566/udp

# run container
CMD /srv/app/replace_config.sh && /srv/app/replace_credentials.sh && npm start
