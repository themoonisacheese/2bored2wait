# 2lazy2wait
A discord implementation of the popular proxy to wait out 2b2t.org's way too long queue.

![](https://i.imgur.com/65dvy5o.jpg) 

# How to install
1. Download node.js and install it. On non-windows platforms, you also need npm.
2. Clone the repository from the commandline, use `git clone --recursive https://github.com/surprisejedi/2lazy2wait`
3. Open a terminal and navigate to the folder you downloaded it
4. Run the command `npm install && cd 2boredwait && npm install`
7. Inside the directory 2bored2wait/ copy secrets.json.example and name it secrets.json. Fill out your minecraft information in the file. Note that you must use your email adress and not your minecraft username.
8. If you so wish, edit the configuration in config.json. (On Linux ports below 1024, including port 80, require you to run the program with administrator rights.)
9. You need to create a discord bot. Follow this guide: https://discordpy.readthedocs.io/en/latest/discord.html, but don't go into any programming tutorials
10. In the directory above edit the file auth.json and replace BOT_TOKEN with your bots token
11. For trust reasons, this tool does not update automatically. Check back here once in a while to see if there are any updates.

# Donations

Donations are what helps me keep developing this. They keep me motivated, if you do end up donating you'll get access to the beta and many more features.

If you donate enough I'll tell you how to bypass the queue...

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.me/sjedi2lazy)

# How to use
1. Read the code to ensure i'm not stealing your credentials. i'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Run `node discordBot.js` (you might need to run this as administrator/sudo)
3. Your bot should be online now, in discord it should show up with "Queue stopped."
4. See below for commands on how to start the queue.
5. You can access the original 2bored2wait web interface from http://localhost
6. Once the queue reaches a low number, connect to the minecraft server at address `localhost`. Currently, you have to connect BEFORE reaching the end of the queue or you will not spawn in the world correctly (I'm told that sneaking around and right-clicking things eventually makes you spawn correctly but I was not able to verify that).
7. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

# Commands
- 'start' will start the queue. It takes between 15-30 seconds for the bot to update with the queue position.
- 'update' will send an update to the current channel with your position and ETA.
- 'stop' will stop the queue.

# Forewarning
Do not give your secrets.json file to anyone under any circumstances.
My bot does not connect to anything except discord. Please check my source
code to be **EXTRA** sure.

I would recommend building this from scratch because if I were you I wouldn't trust me. Follow some tutorials for making a discord bot online and use [the documentation](https://github.com/themoonisacheese/2bored2wait/blob/master/API%20documentation.md) as a reference.

Do not repeatedly stop and start the queue, eventually you will not be able to log in.

# 2bored2wait
This is a fork of 2bored2wait, made by [themoonisacheese](https://github.com/themoonisacheese)

I would advise looking over the information for the project [in the readme for 2bored2wait](https://github.com/themoonisacheese/2bored2wait/blob/master/README.md)

# Info
If you need to contect me for help my discord is 
halcyon#8384

# Todo
- [ ] Mention you once you get below 30 queue

- [ ] Join queue at a specific time. (E.g 'start 8:30')

- [ ] Calculate the perfect time to join the queue based on queue size/eta. (E.g aim to join 2b2t between 8-9pm)
