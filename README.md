<!-- Badges -->
[![contributors]][contributors-url]
[![stars]][stars-url]
[![issues]][issues-url]
[![forks]][forks-url]
[![donate]][donate-url]
[![discord]][discord-url]

<!-- PROJECT LOGO -->
</br>
<div align="center">

<a href="#readme.md"><img align="center" src="images/logo.png" alt="Logo" width="80" height="80"><a>

### 2bored2wait

A proxy to wait out 2b2t.org's way too long queue. Includes a small webserver a REST-like API for external control

# 2Bored2Wait is not updated to 1.19. There are no plans to update. This repository is kept for posterity, but there will not be any future update here.
# Other people are free to fork this repo and distribute updated copies according to the [licence](LICENSE) (GPL-3.0).

</div>

<!-- TABLE OF CONTENTS -->
<details open="open">
<summary>Table of Contents</summary><p>

1. [About The Project](#about-the-project)
   - [Built With](#built-with)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
3. [How to use](#how-to-use)
4. [Configuration](#configuration)
5. [Roadmap and known issues](#roadmap-and-known-issues)
   - [How to make a bug report](#how-to-make-a-bug-report)
6. [Addons](#addons)
7. [Contributing](#contributing)
8. [License](#license)
9. [Testing](#testing)

</p></details>

<!-- ABOUT THE PROJECT -->

## About The Project

A proxy to wait out 2b2t.org's way too long queue.  
Please Note that because of security reasons this tool doesn't auto-update without a plug-in (check out the addons section)! Also 2b2w does not show ETA from 2b2t.  
The ETA is calculated based on position in the queue. This results in better ETA most of the time.

### Built With

- node.js
- npm
- HTML

<!-- GETTING STARTED -->

# Getting Started

To get a local copy up and running follow these simple steps.

## Prerequisites

Please obtain all required items

- A discord bot (optional) ([detailed instructions](https://discordpy.readthedocs.io/en/stable/discord.html))

## Installation
   
### Video installation

Click the picture or link bellow to watch!   
~~[![Click Me To Watch!](https://img.youtube.com/vi/3kCKnwuiHak/0.jpg)](https://youtu.be/3kCKnwuiHak)~~ Video removed by owner.
  
   
~~https://youtu.be/3kCKnwuiHak~~ Video removed by owner.

### Quick Install (64-bit Systems)

1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Download the executable [here](https://github.com/themoonisacheese/2bored2wait/releases/latest)
3. (Optional) Take a look at the [Configs](#configuration)! 

### Manual Install (32-bit systems, and fallback for quick install):

1. Download and install [node.js](https://nodejs.org/) version 16 or above and [git](https://git-scm.com). You need git even if you download the repository as zip because it is to install the dependencies via npm.
2. Open a terminal then clone this repo then cd into folder:

```sh
 git clone https://github.com/themoonisacheese/2bored2wait
 cd 2bored2wait
```

3. Run ```yarn``` to install the required libraries
4. Start the program with ````yarn start````.

### Docker

1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. `docker run -d -p 8080:8080 -p 25565:25565 -e NODE_CONFIG='{"username": "account email", "accountType": "mojang or microsoft", "mcPassword": "your password", "BotToken": "your discord bot token"}' 2bored2wait/2bored2wait:latest`. The docker image is automatically up to date after each push to this repo. Docker images are available for `amd64` and `arm64` among other platforms.
3. Open a browser and navigate to http://localhost:8080
4. Press the "Start queuing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
5. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`.
6. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

If you want to change the configuration or you don't want your credentials in the bash history you will have to mount config/local.json manually.

# Configuration

- You can change all credentials and whether you want update messages by simply editing the values in local.json or deleting that file.
- For the quick install, configs are located: 
   - gnu+linux/macos: $HOME/.config/2bored2wait/
   - windows: C:\Users\USERNAME\AppData\Roaming\2bored2wait\Config\ 


# How to use

1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Run `npm start`
3. It will now ask for your Minecraft email and password (or permission to use saved launcher data instead). If you want update messages then you need to type Y otherwise N. If you are using the discord bot you need to add your token. Then answer Y or N if you want to save your Minecraft credentials. If you answer N you will need to re-enter your Minecraft login information into the console each time you start the program.
4. Refer to Commands on how to use 2b2w from the console. Otherwise keep on reading for the web interface.
5. Now open a browser and navigate to http://localhost: your web port here (default 8080).
6. Press the "Start queuing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
7. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`.
8. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

## Commands

All commands can be used through discord or simply typed in the console window.

- Please note that the time zone for the calculations is based off your computer's time!

- Here are some basic commands:
   - `start` will start the queue. It takes between 15-30 seconds for the bot to update with the queue position.
      - `start 14:00` will start at 2pm.
   - `play 8:00` will try to calculate the right time to join so you can play at 8:00
   - `update` will send an update to the current channel with your position and ETA.
   - `stop` will stop the queue.
- Type `help` for a full ist of commands

<!-- ROADMAP -->

## Roadmap and known issues

See the [open issues](https://github.com/themoonisacheese/2bored2wait/issues) for a list of proposed features (and known issues).

- Starting the queue will revoke your Minecraft token. this means that you will not be able to join normal Minecraft servers until you restart the game
- If you connect after the queue is finished or reconnect the proxy will send cached data. Otherwise you would fly in an empty world. However not all data will be resend. You can move out of render distance (I find going through a nether portal works best) and return to fix this issue. Sometimes the client renders a cached chunk with a blank texture.

### How to make a bug report

Try updating 2bored2wait, run `npm update` (if you are using the source code), and update your system.

• Give info in bug reports such as....

- Output of `npm list` (if you are using the source code).
- Version of program.
- Other error messages. 

Make a bug report [here](https://github.com/themoonisacheese/2bored2wait/issues). Feel free to ask questions or add feature requests as well.

## Addons
~~[Auto-Update](https://github.com/KozmikCode/2b2t-auto-update) Allows you to have auto updates!~~ REMOVED DUE TO 404 
   
<!-- CONTRIBUTING -->

## Contributing
   

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b themoonisacheese/2bored2wait`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin themoonisacheese/2bored2wait`)
5. Open a Pull Request

<!-- LICENSE -->

## License

Distributed under the GPL-3.0 License. See [this](LICENSE) for more information.

<!-- ACKNOWLEDGEMENTS -->

# Testing

- Run `npm test` to run test.js

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors]: https://img.shields.io/github/contributors/themoonisacheese/2bored2wait.svg?style=for-the-badge&color=3e961e
[contributors-url]: https://github.com/themoonisacheese/2bored2wait/graphs/contributors
[stars]: https://img.shields.io/github/stars/themoonisacheese/2bored2wait.svg?style=for-the-badge&color=yellow
[stars-url]: https://github.com/themoonisacheese/2bored2wait/stargazers
[issues]: https://img.shields.io/github/issues-raw/themoonisacheese/2bored2wait.svg?label=issues&style=for-the-badge&color=orange
[issues-url]: https://github.com/themoonisacheese/2bored2wait/issues
[forks]: https://img.shields.io/github/forks/themoonisacheese/2bored2wait.svg?style=for-the-badge
[forks-url]: https://github.com/themoonisacheese/2bored2wait/network/members
[donate]: https://img.shields.io/badge/Donate-PayPal-green.svg?style=for-the-badge
[donate-url]: https://paypal.me/themoonisacheese
[discord]: https://img.shields.io/badge/dynamic/json?label=Discord&color=7289da&query=%24.presence_count&url=https%3A%2F%2Fdiscordapp.com%2Fapi%2Fguilds%2F879482948099919903%2Fwidget.json&style=for-the-badge
[discord-url]: https://discord.gg/9ZrXZp7nVj
