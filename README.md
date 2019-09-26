# 2bored2wait
A proxy to wait out 2b2t.org's way too long queue.


# How to install - old tutorial
1. Download node.js and install it. On non-windows platforms, you also need npm.
2. Download this repository with the green button (top right of this page). If you downloaded it as zip, unzip it.
3. Open a terminal and navigate to the folder you downloaded it
4. Run `npm install`
5. Copy secrets.json.example and name it secrets.json. Fill out your minecraft information in the file. Note that you must use your email adress and not your minecraft username.
6. If you so wish, edit the configuration in config.json. (On Linux ports below 1024, including port 80, require you to run the program with administrator rights.)
7. For trust reasons, this tool does not update automatically. Check back here once in a while to see if there are any updates.

# How to install - better way (`linux`/`debian`)
0. Use a (preferably) 24/7 server enviroment. `ssh` into it.
1. Install dependencies using your package manager (`apt` on `debian`): `npm`, `nodejs`, `git` and `screen` with `sudo apt install npm nodejs git screen -y`
2. `git clone https://github.com/sijanec/2bored2wait && cd 2bored2wait`
3. `npm install`
4. `cp secrets.json.example secrets.json`
5. edit file with your Minecraft credentials with your chosen editor. I use `nano secrets.json`. Input your Minecraft username and password. Use your email instead of your username if you have created your account after 2012 or have migrated it.
6. `chmod 700 secrets.json` to prevent other users on the system from viewing your Minecraft password.
7. edit file with configuration with your chosen editor. I use `nano config.json`. Change the password (for the web interface) and ports if you want to.
note: some users have reported a problem where `lodash` was reported not installed. `npm install lodash` to force install it. 

# How to use
1. Read the code to ensure i'm not stealing your credentials. i'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Run `screen` to create a new persistent terminal. That way the proxy server won't die when you close the `ssh` session with your computer. To exit the virtual screen, hit Ctrl-a, Ctrl-d, to rejoin to the screen, execute `screen -r`
3. In your `screen` session, while in the `2bored2wait` directory, run `npm start`. The program does not output any text to the terminal.
4. Leave your `screen` session with Ctrl-a Ctrl-d. Execute `ip a` to show your IP address. You may want to set up port forwarding to access your host from the Internet.
5. Open a browser on a device that can reach your host and type <your-IP>:8080 in the address bar, to show the web interface.
6. Enter your password and press the "Start queing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
7. once the queue reaches a low number, connect to the minecraft server at your IP address. Currently, you have to connect BEFORE reaching the end of the queue.
8. To disconnect without having to requeue afterwards, just Disconnect from the game's pause menu.
9. Reconnecting: reconnect to your IP address (with your MC client) and <del>hit F3+A to reload chunks. This is important. Otherwise </del> you will only see black. I don't know how to fix this. Somehow we have to force 2b2t to send us chunks again or something. I know that kiIIing yourself (!!! in game obviously !!!) and respawning will resend the chunks...
10. Disconnecting from 2b2t (you will have to requeue for your next connect) (I don't see the point in doing that). Use the Stop Queueing button in the web interface.

# Video guide
Here's a video guide on how to install and use 2b2w: https://www.youtube.com/watch?v=oWeCmZNYAW4 
The video does not cover the new linux installation method and `sijanec`'s fork features.

# Known issues
- starting the queue will revoke your minecraft token. this means that you will not be able to join normal minecraft servers until you restart the game
- starting the queue too many times in a row can sometimes boot you out of your minecraft account (starting the queue or connecting in the minecraft client will tell you "wrong email or password"). to fix this, log in to your account at minecraft.net, then restart minecraft. both of these issues are limitations put in place by mojang to prevent account stealing, and are not fixable.
- Some people report not being able to ride animals using this proxy.
- 2b2t sometimes bugs out and removes you from the queue without telling you. In this case, your queue position will no longer move. Reconnect to fix this.

# Features added by `sijanec`'s fork
- antiafk: every 50 seconds, if `proxyClient` is not connected and `finishedQueue` is `true`, `/r RusherB0t !que` will be sent as a `chat` to 2b2t to prevent getting AfkKicked. That way you can stay online forever.
- - Note: after disconnecting from the proxy server, your Minecraft client's chunks of 2b2t world will obviously get purged. Since the proxy server does not store map data (too complicated to implement, and also not needed, read on), after reconnection, 2b2t will have no idea that you don't have the chunks and it will not resend them, that's why you will end up with a black screen. To mitigate this problem, after reconnection, press A whilst holding down F3, which will request new chunks from 2b2t.
