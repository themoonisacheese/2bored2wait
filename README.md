# 2bored2wait
A discord implementation of the popular proxy to wait out 2b2t.org's way too long queue.


# How to install
1. Download node.js and install it. On non-windows platforms, you also need npm.
2. Download this repository with the green button (top right of this page). If you downloaded it as zip, unzip it.
3. Open a terminal and navigate to the folder you downloaded it
4. Run `npm install`
5. Change directory to 2b2w/
6. Run `npm install`
7. Copy secrets.json.example and name it secrets.json. Fill out your minecraft information in the file. Note that you must use your email adress and not your minecraft username.
8. If you so wish, edit the configuration in config.json. (On Linux ports below 1024, including port 80, require you to run the program with administrator rights.)
9. You need to create a discord bot. Follow this tutorial up until the programming part.
10. Edit the file discord.json and replace BOT_TOKEN with your bots token
11. For trust reasons, this tool does not update automatically. Check back here once in a while to see if there are any updates.


# How to use
1. Read the code to ensure i'm not stealing your credentials. i'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Run `node discordBot.js`
3. Your bot should be online now, in discord it should show up with "Queue stopped."
4. See below for commands on how to start the queue.
5. You can access the original 2bored2wait web interface from http://localhost
6. Once the queue reaches a low number, connect to the minecraft server at address `localhost`. Currently, you have to connect BEFORE reaching the end of the queue or you will not spawn in the world correctly (I'm told that sneaking around and right-clicking things eventually makes you spawn correctly but I was not able to verify that).
7. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

# Commands
- '/start' will start the queue. It takes between 15-30 seconds for the bot to update with the queue position.
- '/update' will send an update to the current channel with your position and ETA.
- '/stop' will stop the queue.

# Forewarning
Do not give your secrets.json file to anyone under any circumstances.
My bot does not connect to anything except discord. Please check my source
code to be **EXTRA** sure.

Do not repeatedly stop and start the queue, eventually it will not be able to log in.

# Video guide
Coming soon

# Known issues
- starting the queue will revoke your minecraft token. this means that you will not be able to join normal minecraft servers until you restart the game
- starting the queue too many times in a row can sometimes boot you out of your minecraft account (starting the queue or connecting in the minecraft client will tell you "wrong email or password"). to fix this, log in to your account at minecraft.net, then restart minecraft. both of these issues are limitations put in place by mojang to prevent account stealing, and are not fixable.
- Some people report not being able to ride animals using this proxy.
- 2b2t sometimes bugs out and removes you from the queue without telling you. In this case, your queue position will no longer move. Reconnect to fix this.

