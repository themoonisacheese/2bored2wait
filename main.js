
//imports
var mc = require('minecraft-protocol'); //duh
var fs = require('fs');



var secrets = JSON.parse(fs.readFileSync('secrets.json'));


var client = mc.createClient({
  host: "2b2t.org",
  port: 25565,
  username: secrets.username,
  password: secrets.password,
  version: "1.12.2"
});

client.on("packet", function(data,meta){
    if(meta.name === "playerlist_header"){
        var headermessage = JSON.parse(data.header);
        var positioninqueue = headermessage.text.split("\n")[5].substring(25);
        var ETA = headermessage.text.split("\n")[6].substring(27);
        console.log("Position: " +positioninqueue + "\nETA: " + ETA);
        
    }
    // console.log("packet  meta: " + JSON.stringify(meta) +"\n\tdata: "+JSON.stringify(data));
});
