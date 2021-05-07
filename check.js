let Parser = require('rss-parser');
let parser = new Parser();
const boxen = require('boxen');
var pjson = require('./package.json');
var cv1 = pjson.version;
var cv = 'v' + cv1;


(async () => {

	let feed = await parser.parseURL('https://github.com/themoonisacheese/2bored2wait/releases.atom');

	feed.items.every(item => {
		var lv = (item.title);
		if (cv != lv) {
			console.log(boxen('New Update Available! → ' +lv, {padding: 1, margin: 1, align: 'center', borderColor: 'red', float: 'center', borderStyle: 'round'}));
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
