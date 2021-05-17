[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/themoonisacheese?locale.x=fr_FR)



<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/themoonisacheese/2bored2wait">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">2bored2wait</h3>

  <p align="center">
    A proxy to wait out 2b2t.org's way too long queue. Includes a small webserver and a REST-like API for external control
    <br />
    <a href="https://github.com/themoonisacheese/2bored2wait"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/themoonisacheese/2bored2wait">View Demo</a>
    ·
    <a href="https://github.com/themoonisacheese/2bored2wait/issues">Report Bug</a>
    ·
    <a href="https://github.com/themoonisacheese/2bored2wait/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#configuration">Configuration</a></li>
    <li><a href="#roadmap-and-known-issues">Roadmap and known issues:</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#testing">Testing</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

A proxy to wait out 2b2t.org's way too long queue. Please Note that because of security reasons this tool doesn't auto-update! Also 2b2w does not show ETA from 2b2t. The ETA is calculated based on position in the queue. This results in better ETA most of the time.


### Built With

* []()Node 
* []()Npm
* []()HTML



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

Please optain all required items
* npm/node.js 14.x or later
* A discord bot (optional)
  ```sh
  Go here for detailed instructions: https://discordpy.readthedocs.io/en/stable/discord.html
  ```

### Installation

#Windows:
1. Download the executable [here](https://github.com/themoonisacheese/2bored2wait/releases/latest)
2. (Optional) Take a look at `config/default.json`, edit your values and place the config under `Home directory of your user/.2bored2wait/config/local.json`

#Linux and Mac:
1. Download and install node.js version 14 or above and git. You need git even if you download the repository as zip because it is to install the dependencies via npm.
2. Open a terminal then clone this repo then cd into folder:
 ```sh
  git clone https://github.com/themoonisacheese/2bored2wait
  cd 2bored2wait
  ```
3. Run `npm install`
4. Start the program and answer the questions.

# Docker usage guide (self-compose)
1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Edit docker-compose.yml and start the container
```
docker-compose up -d
```
3. Open a browser and navigate to http://localhost, attach to the container, or open a chat dialog with the discord bot
4. Press the "Start queuing" button/message the bot or cli "start"
5. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`.
6. After you log off, stop the 2bored2wait queue or your account will stay logged in on the server. You can reconnect to localhost in case you disconnected by accident.

## Additional configuration

If you want to change the configuration or you don't want your credentials in the bash history you will have to mount config/local.json manually.

To access logs you can just do
```
docker logs 2bored2wait
```

You can also easily change which port to map from the docker-compose, for example, if you want your server reachable on port 25000 instead of the default 25565 and your webserver on port 8080 you can change these varibles in the docker-compose
```
      ports:
         - "8080:8080"
         - "25000:25565"
```
# Docker install guide (precomposed image)
1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. `docker run 2bored2wait/2bored2wait:latest -d -p 80:8080 -p 25565:25565 -e NODE_CONFIG='{"username": "user@domain.com", "mcPassword": "myverysecretpassword", "BotToken": "mydiscordbottoken"}'`. The docker image is automatically up to date after each push to this repo. Docker images are available for `amd64` and `arm64`
3. Open a browser and navigate to http://localhost
4. Follow "How to use" from steps 5 onwards.

If you want to change the configuration or you don't want your credentials in the bash history you will have to mount config/local.json manually.

All additional configurations from the Docker usage guide apply here as well.

# Docker build guide
1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Clone the repo
3. run `scripts/gen_dockerignore.sh` to generate the .dockerignore
4. `docker build -t 2bored2wait .` to build the image.
5. Once the image has built, you can start it with:
```
docker run --name 2bored2wait -d -p 80:8080 -p 25565:25565 -e NODE_CONFIG='{"username": "user@domain.com", "mcPassword": "myverysecretpassword", "BotToken": "mydiscordbottoken"}' 2bored2wait
```
** Remember to change user@domain.com and myverysecretpassword with your actual Minecraft credentials, as well as mydiscordbottoken with your actual Discord Bot Token **

6. Open a browser and navigate to http://localhost
7. Press the "Start queuing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
8. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`.
9. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

If you want to change the configuration or you don't want your credentials in the bash history you will have to mount config/local.json manually.

All additional configurations from the Docker usage guide apply here as well.


# Configuration

* []() You can change all credentials and whether you want update messages by simply editing the values in local.js or deleating that file.


<!-- ROADMAP -->
# Roadmap and known issues

See the [open issues](https://github.com/themoonisacheese/2bored2wait/issues) for a list of proposed features (and known issues).

- Starting the queue will revoke your Minecraft token. this means that you will not be able to join normal Minecraft servers until you restart the game
- If you connect after the queue is finished or reconnect the proxy will send cached data. Otherwise you would fly in an empty world. However not all data will be resend. You can move out of render distance (I find going through a nether portal works best) and return to fix this issue. Sometimes the client renders a cached chunk with a blank texture.


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the GPL-3.0 License. See `LICENSE` for more information.


<!-- ACKNOWLEDGEMENTS -->
# Testing

- Run NPM test to run test.js








<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/themoonisacheese/2bored2wait.svg?style=for-the-badge
[contributors-url]: https://github.com/themoonisacheese/2bored2wait/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/themoonisacheese/2bored2wait.svg?style=for-the-badge
[forks-url]: https://github.com/themoonisacheese/2bored2wait/network/members
[stars-shield]: https://img.shields.io/github/stars/themoonisacheese/2bored2wait.svg?style=for-the-badge
[stars-url]: https://github.com/themoonisacheese/2bored2wait/stargazers
[issues-shield]: https://img.shields.io/github/issues/themoonisacheese/2bored2wait.svg?style=for-the-badge
[issues-url]: https://github.com/themoonisacheese/2bored2wait/issues
