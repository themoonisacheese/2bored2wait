FROM node:13.12-stretch-slim

LABEL mantainer="edofullin"
LABEL name="2bored2wait"

# copy application

WORKDIR "/srv/app"

COPY . "/srv/app"

# install requirements
RUN ["npm", "install"]

EXPOSE 80/tcp
EXPOSE 25565/tcp
EXPOSE 25565/udp

# run container
CMD /srv/app/replace_credentials.sh && npm start