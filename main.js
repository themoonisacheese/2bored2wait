
//imports
var mc = require('minecraft-protocol'); //duh
var fs = require('fs'); //to read creds file
var webserver = require('./webserver.js'); //to serve the webserver



var secrets = JSON.parse(fs.readFileSync('secrets.json')); //read the creds
var config = JSON.parse(fs.readFileSync('config.json')); //read the config



webserver.createServer(config.ports.web); //create the webserver
webserver.onstart(function() { //set up actions for the webserver
    startQueuing();
});
webserver.onstop(function(){
    stop();
})


//vars
var proxyClient; //a reference to the client that is the actual minecraft game
var client; //the client to connect to 2b2t
var server; //the minecraft server to pass packets


//function to disconnect from the server
function stop(){
    webserver.isInQueue = false;
    webserver.queuePlace = "None";
    webserver.ETA = "None";
    client.end(); //disconnect
    if (proxyClient) {
        proxyClient.end("Stopped the proxy."); //boot the player from the server
    }
    server.close(); //close the server
}


//function to start the whole thing
function startQueuing() {
    webserver.isInQueue = true;
    client = mc.createClient({ //connect to 2b2t
        host: "2b2t.org",
        port: 25565,
        username: secrets.username,
        password: secrets.password,
        version: "1.12.2"
      });
    var finishedQueue = false;
    client.on("packet", function(data,meta){ //each time 2b2t sends a packet
        if(!finishedQueue && meta.name === "playerlist_header"){ //if the packet contains the player list, we can use it to see our place in the queue
            var headermessage = JSON.parse(data.header);
            var positioninqueue = headermessage.text.split("\n")[5].substring(25);
            var ETA = headermessage.text.split("\n")[6].substring(27);
            webserver.queuePlace = positioninqueue; //update info on the web page
            webserver.ETA = ETA;
            server.motd = "Place in queue: " +  positioninqueue; //set the MOTD because why not
        }
        if (!finishedQueue && meta.name === "chat") { //we can know if we're about to finish the queue by reading the chat message
            //we need to know if we finished the queue otherwise we crash when we're done, because the queue info is no longer in packets the server sends us.
            var chatMessage = JSON.parse(data.message);
            if(chatMessage.text && chatMessage.text === "Connecting to the server..."){
                finishedQueue = true;
                webserver.queuePlace = "FINISHED";
                webserver.ETA = "NOW";
            }
        } 
    
        if (proxyClient) { //if we are connected to the proxy, forward the packet we recieved to our game.
            filterPacketAndSend(data, meta, proxyClient);
        }
        // console.log("packet  meta: " + JSON.stringify(meta) +"\n\tdata: "+JSON.stringify(data));
    });
    
    //set up actions in case we get disconnected.
    client.on('end', function(){
        if (proxyClient) {
            proxyClient.end("Connection reset by 2b2t server.\nReconnecting...");
        }
        stop();
        setTimeout(startQueuing, 100); //reconnect after 100 ms
    });

    client.on('error', function(err){
        if (proxyClient) {
            proxyClient.end("Connection error by 2b2t server.\n Error message: " + err + "\nReconnecting...");
        }        
        stop();
        setTimeout(startQueuing, 100); //reconnect after 100 ms
    });
    
    
    
    server = mc.createServer({ //create a server for us to connect to
        'online-mode':false,
        encryption:true,
        host:'0.0.0.0',
        port:config.ports.minecraft,
        version:'1.12.2',
        maxPlayers: 1
    })
    
    server.on('login', function(newProxyClient){ //handle login stuff
        newProxyClient.write('login', {
            entityId: newProxyClient.id,
            levelType: 'default',
            gameMode: 0,
            dimension: 0,
            difficulty: 2,
            maxPlayers: server.maxPlayers,
            reducedDebugInfo: false
          });
        newProxyClient.write('position', {
            x: 0,
            y: 1.62,
            z: 0,
            yaw: 0,
            pitch: 0,
            flags: 0x00
          });
    
          newProxyClient.on('packet', function(data, meta){//redirect everything we do to 2b2t            
              filterPacketAndSend(data, meta, client);
          })
    
        proxyClient = newProxyClient;
    });
}



//function to filter out some packets that would make us disconnect otherwise.
//this is where you could filter out packets with sign data to prevent chunk bans.
function filterPacketAndSend(data, meta, dest) {
    if (meta.name !="keep_alive" && meta.name !="update_time") { //keep alive packets are handled by the client we created, so if we were to forward them, the minecraft client would respond too and the server would kick us for responding twice.
        dest.write(meta.name, data);
    }
}