# 2bored2wait
A proxy to wait out 2b2t.org's way too long queue.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/themoonisacheese?locale.x=fr_FR)

# How to install
1. Download node.js and install it. On non-windows platforms, you also need npm.
2. Download this repository with the green button (top right of this page). If you downloaded it as zip, unzip it.
3. Open a terminal and navigate to the folder you downloaded it in.
4. Run `npm install`
5. Copy secrets.json.example and name it secrets.json. Fill out your Minecraft information in the file. Note that you must use your email address and not your Minecraft username.
6. If you wish, edit the configuration in config.json. (On Linux, ports below 1024, including port 80, require you to run the program with administrator rights.)
7. For trust reasons, this tool does not update automatically. Check back here once in a while to see if there are any updates.

# How to use
1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
4. Run `npm start`
5. A browser window should open. You can close it if you want at any moment, and you can access it again at address http://localhost
6. Press the "Start queuing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
7. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`. Currently, you have to connect BEFORE reaching the end of the queue or you will not spawn in the world correctly (I'm told that sneaking around and right-clicking things eventually makes you spawn correctly but I was not able to verify that).
8. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

# Video guide
Here's a video guide on how to install and use 2b2w: https://www.youtube.com/watch?v=oWeCmZNYAW4 

# Docker usage guide (if you know how to use docker)
1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. From a terminal run:
```
docker run --name 2b2w -d -p 80:80 -p 25565:25565 -e MOJANG_USERNAME="user@domain.com" -e MOJANG_PASSWORD="myverysecretpassword" edoardo396/2bored2wait
```
3. Open a browser and navigate to http://localhost
4. Press the "Start queuing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
5. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`. Currently, you have to connect BEFORE reaching the end of the queue or you will not spawn in the world correctly (I'm told that sneaking around and right-clicking things eventually makes you spawn correctly but I was not able to verify that).
6. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

## Additional configuration

If you want to change the configuration you will have to mount config.json manually, you can also mount secrets.json manually if you don't want your credentials in the bash history

To access logs you can just do
```
docker logs 2b2w
```

You can also easily change which port to map from the docker run command, for example, if you want your server reachable on port 25000 instead of the default 25565 and your webserver on port 8080 you would run
```
docker run --name 2b2w -d -p 80:**8080** -p 25565:**25000** -e MOJANG_USERNAME="user@domain.com" -e MOJANG_PASSWORD="myverysecretpassword" edoardo396/2bored2wait
```

To make 2b2w start automatically at boot you can run:
```
docker run --name 2b2w --restart unless-stopped -d -p 80:80 -p 25565:25565 -e MOJANG_USERNAME="user@domain.com" -e MOJANG_PASSWORD="myverysecretpassword" edoardo396/2bored2wait
```

# Docker build guide
1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Clone the repo and run `docker build -t 2bored2wait .` to build the image.
3. Once the image has built, you can start it with:
```
docker run --name 2b2w -d -p 80:80 -p 25565:25565 -e MOJANG_USERNAME="user@domain.com" -e MOJANG_PASSWORD="myverysecretpassword" 2bored2wait
```
** Remember to change user@domain.com and myverysecretpassword with your actual Minecraft credentials! **

4. Open a browser and navigate to http://localhost
5. Press the "Start queuing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
6. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`. Currently, you have to connect BEFORE reaching the end of the queue or you will not spawn in the world correctly (I'm told that sneaking around and right-clicking things eventually makes you spawn correctly but I was not able to verify that).
7. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

If you want to change the configuration you will have to mount config.json manually, you can also mount secrets.json manually if you don't want your credentials in the bash history.

All additional configurations from the Docker usage guide apply here as well.

# Known issues
- Starting the queue will revoke your Minecraft token. this means that you will not be able to join normal Minecraft servers until you restart the game
- Starting the queue too many times in a row can sometimes boot you out of your Minecraft account (starting the queue or connecting in the Minecraft client will tell you "wrong email or password"). to fix this, log in to your account at minecraft.net, then restart Minecraft. Both of these issues are limitations put in place by Mojang to prevent account stealing and are not fixable.
- Some people report not being able to ride animals using this proxy.
- 2b2t sometimes bugs out and removes you from the queue without telling you. In this case, your queue position will no longer move. Reconnect to fix this.
