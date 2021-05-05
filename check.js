let Parser = require('rss-parser');
let parser = new Parser();
const { exec} = require('child_process');
const boxen = require('boxen');
var cv = "v0.1.17";

(async () => {

    let feed = await parser.parseURL('https://github.com/themoonisacheese/2bored2wait/releases.atom');



    feed.items.every(item => {
        console.log(item.title);
        var lv = (item.title);
        if (cv != lv) {
            console.log(boxen('New Update Available', {padding: 1}));
            process.on('exit', function(code) {
    	    return console.log(`Please update to contine or type "node main.js" to bypass!`);
		});
            
        } else {
		console.log("Starting 2b2w");
		require('child_process').fork('main.js'); //change the path depending on where the file is.

		

	
	
		
	}


        
    });
    

})();

