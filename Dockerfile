FROM node:13.12-stretch-slim

LABEL mantainer="edofullin"
LABEL name="2bored2wait"

# copy application

WORKDIR "/srv/app"

COPY . "/srv/app"

# install requirements
RUN apt-get update && apt-get install -y \
    git\
    && rm -rf /var/lib/apt/lists/*

RUN ["npm", "install"]


# exposing 8080 (webui), 25566 (mc proxy)
EXPOSE 8080/tcp
EXPOSE 25566/tcp
EXPOSE 25566/udp

# run container
CMD /srv/app/replace_credentials.sh && npm start
