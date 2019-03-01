# 2bored2wait
A proxy to wait out 2b2t.org's way too long queue.

# how to use
1. read the code to ensure i'm not stealing your credentials. i'm not, but you shouldn't take my word for it.
2. run "npm install minecraft-protocol"
3. put your minecraft email address and password in secrets.json.
4. run node main.js
5. you're done. you can monitor your queue position by going to http://localhost/ in your web browser.
6. once the queue reaches a low number, connect to the minecraft server at address localhost. Currently, you have to connect BEFORE reaching the end of the queue or you will not spawn in the world correctly.
