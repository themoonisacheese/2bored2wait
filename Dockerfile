FROM node:alpine

LABEL maintainer="mrgeorgen"
LABEL name="2bored2wait"

# copy application
COPY . "/srv/app"

WORKDIR "/srv/app"

# remove comments from config/default.json
RUN sed -i 's/\/\/.*$//' config/default.json

# install requirements
RUN npm install --omit=dev

# exposing 8080 (webui), 25566 (mc proxy)
EXPOSE 8080/tcp
EXPOSE 25565/tcp

# run container
CMD npm start
