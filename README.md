# 2bored2wait
A proxy to wait out 2b2t.org's way too long queue.

# How to use
1. read the code to ensure i'm not stealing your credentials. i'm not, but you shouldn't take my word for it.
2. run `npm install minecraft-protocol`
3. put your minecraft email address and password in secrets.json.
4. run `node main.js`
5. open a browser window and go to http://localhost (or the adress of the server if you're hosting it elsewhere. yes, this works. just ensure you opened ports 80 (web) and 25565 (minecraft) on your router)
6. press the "Start queing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
7. once the queue reaches a low number, connect to the minecraft server at address `localhost`. Currently, you have to connect BEFORE reaching the end of the queue or you will not spawn in the world correctly.
8. after you log off, click the "stop queuing" button. this is really important, as you will not actually disconnect until you do that.

# Plans for the future
- make the proxy disconnect when you log off
- add some QOL features, such as anti-sign ban or anti-book ban

# Known issues
- starting the queue will revoke your minecraft token. this means that you will not be able to join normal minecraft servers until you restart the game
- starting the queue too many times in a row can sometimes boot you out of your minecraft account (starting the queue or connecting in the minecraft client will tell you "wrong email or password"). to fix this, log in to you account at minecraft.net, then restart minecraft. both of these issues are limitations put in place by mojang to prevent account stealing, and are not fixable.

