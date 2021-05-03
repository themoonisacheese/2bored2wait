const fs = require("fs");
const jsonminify = require("node-json-minify");
module.exports = {
	readJSON: (filePath) => {
		JSON.parse(jsonminify(fs.readFileSync(filePath, "utf-8")));
	},
	mkdir: (dir) => {
		try {
			fs.mkdirSync(dir);
		} catch(err) {
			if(err.code !== 'EEXIST') throw err;
		}
	}
}
