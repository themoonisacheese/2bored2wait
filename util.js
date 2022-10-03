const fs = require("fs");
const jsonminify = require("node-json-minify");
const https = require("https");
module.exports = {
	readJSON: (filePath) => {
		return JSON.parse(jsonminify(fs.readFileSync(filePath, "utf-8")));
	},
	mkdir: (dir) => {
		try {
			fs.mkdirSync(dir, { recursive: true });
		} catch (err) {
			if (err.code !== 'EEXIST') throw err;
		}
	},
	getUUIDForWhitelist: (names) => {
		return new Promise((resolve, reject) => {
			const data = JSON.stringify(names)
			const options = {
				hostname: 'api.mojang.com',
				port: 443,
				path: '/profiles/minecraft',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': data.length
				}
			}
			const req = https.request(options, res => {
				res.on('data', d => {
					let ids = JSON.parse(String.fromCharCode(...d)).map(item => item)
					resolve(ids)
				})
			})
			req.on('error', error => {
				reject(error)
			})
			req.write(data)
			req.end()
		})
	}
}
