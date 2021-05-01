const fs = require("fs");
const jsonminify = require("node-json-minify");
module.exports = {
	readJSON: (filePath) => {
		return JSON.parse(jsonminify(fs.readFileSync(filePath, "utf-8")));
	}
}
