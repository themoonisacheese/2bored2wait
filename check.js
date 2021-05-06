let Parser = require('rss-parser');
let parser = new Parser();
const { exec} = require('child_process');
const boxen = require('boxen');
var pjson = require('./package.json');
var cv1 = pjson.version;
var cv = 'v' + cv1;


(async () => {

    let feed = await parser.parseURL('https://github.com/themoonisacheese/2bored2wait/releases.atom');



    feed.items.every(item => {
        console.log(item.title);
        var lv = (item.title);
        if (cv != lv) {
	    console.log(boxen('New Update Available!', {padding: 1}));
            console.log('Press enter to continue.');
	    process.stdin.once('data', function () {
  	    console.log("Starting 2b2w");
	    require('./main.js');
             
		});
            
        } else {
		console.log("Starting 2b2w");
		require('./main.js');

		

	
	
		
	}


        
    });
    

})();

