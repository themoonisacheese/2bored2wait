FROM node:alpine

LABEL maintainer="mrgeorgen"
LABEL name="2bored2wait"

# copy application

WORKDIR "/srv/app"

COPY . "/srv/app"

# install requirements
RUN npm install

# exposing 8080 (webui), 25566 (mc proxy)
EXPOSE 8080/tcp
EXPOSE 25565/tcp

# run container
CMD npm start
