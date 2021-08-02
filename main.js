// imports
const jsonminify = require("node-json-minify"); // to remove comments from the config.json, because normally comments in json are not allowed
const fs = require('fs');
const mc = require('minecraft-protocol'); // to handle minecraft login session
const webserver = require('./webserver/webserver.js'); // to serve the webserver
const opn = require('open'); //to open a browser window
const discord = require('discord.js');
const {DateTime} = require("luxon");
const https = require("https");
const everpolate = require("everpolate");
const mcproxy = require("@rob9315/mcproxy");
const antiafk = require("mineflayer-antiafk");
const queueData = require("./queue.json");
const util = require("./util");
const save = "./saveid";
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
console.log("Fetching MOTD line...");
var config;
try {
	config = require("config");
} catch(err) {
	if(String(err).includes("SyntaxError: ")) {
		console.error("The syntax in your config file is not correct. Make sure you replaced all values as the README says under 'How to Install' step 5. If it still does not work, check that all quotes are closed. You can look up the json syntax online. Please note that the comments are no problem although comments are normally not allowed in json. " + err)
		process.exit(1);
	}
}

var faviconbase64 = "data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAVuklEQVR4XuVad1TTaboenZ22c\/bszJwpO3d2dnJnbHdmLIBUBURBRcSOFQt2BaWDlFAUUUEQjYpYQGwgKnaxowjSJFiIggVFEBELYO\/vfZ8vCYYELLv33H\/wnIckX36\/5Hve+rxf\/EgikXzUnKGz0Nygs9DcoLPQ3KCz0Nygs9DcoLPQ3KCz0Nygs\/BvoEV4ePgnY8eO\/dzLy+sLwMXF5a\/vgvpaYOrUqZ\/x\/X\/BZzXy+eI7vL29P\/4Q8D1NocF31D\/5UPCXfOrh4fHLjt37hhcVl8RcvX4jtbyy+sD1m7cONYobVfUoq1DiWsXNQ6VlN9IuXrmWUnD67MLNW7cPY+P8CwbV+K4WCQkbOqUdOuq3a88+aequPdKU1B3STSlbpes2bJLGr10nXbFytXTJ0uXShdEx0rnzI6TBoaFSX78Aqbu7p3Sas7PUacIE6YhRowIHDhzsY2NjM7Zjx456jK\/w2TrE3gPwxj+ysvNm1T18epXe499rLbxS4SXjBS885xfP+MXT56+p6nbN5V1paZNmzpz5N3wfIiszJz\/uRtUdKqu4SVeullPxxVI6qyimU4Vn6WROPqUfz6S0A4dp+849lLR5C7FRaFlsHEVGLaLZc+bSLL8AmunqRhMnTaaRoxxpwICBT626d9\/Rvn37ttrk3oUWQUFBv5XdqNqnwe+t\/95GXtMAT18QPWEDPHr6ktiwz9kIUxAJM2bM+OF88eWzFTer6Vp5JV0qLaPzJZfpzLnzlF9wmjKz8+hIegbt23+IUnfsoo1JKbQ6PpFky2IpIjKKQkLnkI+vH7nMcKXxEybS8BGjqP+AgdSrty116do1RZvgW+Hu7v7j9cqq\/Woyb\/unTVyTfKPe5xePn72ih09e0P1Hz6j8RlWJs7PzTwEBAYZM\/ll55S26WnaDOF1IceESFZ5VUG5+IWVk5dCho8doz74DtDV1B63fmEwrV8fTYtkymr8gkoKCQ8nL25emO8+gcU7jadjwEdSv\/wDq2asXmZtb3NQh2RSCg4M\/z8kvCNUm9b54O\/k33n\/w+DkigO7VPXwVGBhotnP3Xg9l+FfRlWsc\/pdK6dz5Eio4fY6yc0\/RsRMn6cCho8T1gVK2plLi+o3ENYEWxcho7rwFFCgNJg9PL5o6bTqNGTuOHIYOo772\/cjapicMcF+HaFMICA39\/eGTl9XaxNRgHi9LSsv2nlVcWHL2fEmMEsUNUHj2vKz0WkUuyGsaAOQ1vV\/74AndrX1I8yIi+ucVyLdXVHL4X9cM\/wuULz9DXIfo6LETGvm\/lRLWrqflnP9cEGlOWDj5+QeSq5sHTZo8lRxHj6HBQxyoj11f6tHDGilwS4doY0BbyS8446vpRUDTABdLy1JRHNHS0CEaA3v0yy3bdnhqex\/kNb1fU\/eIqu\/WvuD8719y+ep17hzEhiN+TkUXLlLhmSIOf7kI\/x279lwfNGhQT4aBvb29wcCBA02nTJk2NXROWGV9\/s90pQkTJ9GIkaNowMBB1Nu2D1l170EmZmYFOmQbAwyQcTK39yn56aCs7PzwI0ePxe47cHDbkWPH048cy8g4ejwzfUNycsCaxET7xMQNdk1hU3Ky083b90oahr6S\/EMmfx\/k7z9m7z\/gan\/9SmhY2ATO\/dfw\/uXS63Sh5AqdLbqgrP4I\/4wsWrchKaVfv35fau7XwsLiaw8v793SoBDy9PLh\/HfRyv\/e1K2bFRkYGkbrkG0KECro+8cyTwZyqzrPBF5qR4R2nmtWerXXGyX\/5Hl96HPu0+179ykrJzd51760JdcrtLyP4neqkE6czCVU\/9lhYbOHDBnyK3v+F1tb21+sra1\/Gzp06JDAoOBqlgLk5u5Jk6dMo9FjxtIQh6HUt6+9yP8u5hYVrVu3bq9DtDGAfGRkTOeKqttZajKAJsnG0BjxZy+UFf+JKuw18\/4eh\/6dmvt0s\/ruy6iomNHc5k6wwKrPfW3vHzh8lJK3bLu3bmNS5ao1CZXc+iq599+atyDyZbBW+KP\/Dxw0mGz72MH7pe3bd7Jjbp\/okNVGQkJCy8jIyM6ckxdBQE3mBaBhjMbQgHi915UFT9fzIP+Aqu\/UUn7hmZ3Tp083K7lyrZZLgKj8RVz55arcP8G5r+7923fuFuInIXE9xa5YSdGLFtPc8Pmq6u9N06Y7k+OYsa859OusrW3yzczMgtq2bduKuUF6f6RDWAstEPYchrnYOAgAakJqgo1BfY0mcXj9MS88Yq+j4OmQv1tLFy5ekfv7+7dfFb92LNoeQl9RfIlOC+HDlR\/KD94XrS+Ntmzbzr0\/iTgCiOWwED+hs8PI18+f1Z87V\/8p6ur\/umcv20oufPOY13dqjtqEG2DSpElfZufJo7Hhx+wxeE4Q0TCGpkEA9uzz2gePaxk1wL37wKOau3UPa+7UPqi5c+9BTfXduppbd2prqm7fq6m8daeGhU41Ez199PiJBWzwX\/G9LG5WQ\/SoQ7+AQz87r4AyMrOF8NmbdpC9vuHyyjUJRbJlK4oWRi8qYs9fmhM27znnv6r4zSCn8RNY\/Y2E\/K2v\/lz8QpnfZ+8yQIvwyEhTLkgPHrCnUKWRrwhdeFEYQ8MgQMmVqxk+\/v5d3Nzc2nALa\/U+mDx5cqspU6ZIuH1+hxaK7x0\/fvwPXOjOoeqfY80vZ9EjQh+FT9X3N2\/bfpsLX2fuAN8D3bt3\/75Hjx4\/j3R09If2d3Vz5+I39U3xY\/Fj07MnWVp2IxMT03MSVRRok64HRtZ8eWE82hLCFP0ZIYvQRe4qjaE0iBpr1210h1yGfv8QgDDAxvgGBZdHZCOu+M+h+NDz87jqQ\/Rg6EHo796bBrl7cPDgwX\/X2vfH3BFGq1tfvfe599uy97v36AH1R0bGxmV87U+4pwFpTcA71ytu3UJuojXV3H\/EhnjMhnhjDKVBlEbB88vXrl\/liU1xTaBSwcOL4mr5DQVreAW3MgVPcgqu6AoObUXJpasK9rCiqPiigr2sKDynUPBInMWG+Glj0mZPJXkF5fHAg7xH1T94OF1ofgw90uCQ5XZ2dv\/Dra81e7+1paVlu969e9tMc3bJwuSnzH1N7\/ciS+79Zl26UmdDwyLm+H2TBkDlZ4ExhnOUOFe5L9eJIgV5ioIFYygjQxkdIkJUj\/Xg93ENrsd9uB\/9HYWOdQTdvHWXbty8TVB5EDooeKztczkCJPsPHd4Bz2Paw7h7nPX+oSPKvIfkTU7ZRlwkHy+NjauNWrS4Nnz+gtqgkNl1LHtfuXt4icoP4aPMfaXyU3vf1NSM9AwMtjFPIZ50yAMI\/+OZ2YkVvEEuUlRVDUPUiM0rjXGf7gqDqIyiAbwW4PdxnZJ0nTAkDKomjumurPwmlZZVCJXHEQFZG+Xo6Ngm42ROOTyvJn\/46HHR8nbs2isGHlT91fFraenyFRTFmh9tD6oPU5\/LjJnc9yfTKMfRQvfbsfCxsVHmPrxvbGLy6o8\/\/hjOPFs2aQAuSj9y2ym5xhuEhzCLYyLD5mEMeBCE0LNhFBBsiFrx\/i2+TpCuvkuVfD8MWn7jljjYgMDB4QYqPbc+THivQ0Pn2gaFhtpywXuNnMekh4r\/hvx22rApmdYkJNJy9PyYJTRvfgQFh8wm31nc9kThmyamvqHDhgvZi7kflb+rubnwfid9\/Y3M8Rs1Vx3ygJOT0y\/nzl+8CxECDyFEsWlsHpMZPAiDIDoq2SgwjCbEOr9\/o+q2MB68DUmLAw3M9CB+6UqZEDjnucej0mdl55aOHDnyt3WbkuZlcrVHziPsG5LfTPEJ6yg2bhXFLJbR\/IiFFMI9HxOfu4cnTRWhj8I3Sqi+Pqz6eljbkIWlJcjXdtLTi2Z+\/yXROBfUIQ+gD+\/cnRbEG8lgT\/BDQWZmTn4ut6HC41nZiuOZJ4v5sZinsWIO1+JMDeC1AL\/PaVTMs0Mxkyk+mpF5IT0js4ifF\/J6Dt+fyc8zeZjKZKIZLGiCOP+\/SkpOmb9tx66CzVtS5Rs3bZavTdwgZ5EjX74iTh6zeKk8IjJaHjZ3njwoOETu6+svd3P3kHPOy53GT5SPGuUoH+zgIO9r319u06tXnmW3bodNTbus1dfXd2Xd\/ydz+6s2Vx3yaqhOar9CNHjNmmWXlLI1lqtwTlZO3lXu0Te5QFXly09XnZKfVaJQBX6eD\/D7eQWFVbmn5FU5+QVVJ3PyKo+fyLq8b\/\/BrHXrk2Qz3N1tUPHxHRMnTvw7zv5GjBjxPev5kIjo6CXhCyJls8PCZcGhs2UBUqnMZ5a\/zN3TSzZzpqts6tTpsgkTJskcx4yTDRsxUjZoyBCZvX0\/Wa9etjLuCDJzc\/MlJiZmiw2Njef8\/vvvP0qUp8E6HAGdBTW4x37i6uraaU\/agZSC0+eeIkwxjSFkL7A6K+a8RQijeEGu1oNfYx0HlxAy54svk4LvQ1s7w4oO0xxOc07mnHqQsH7jbC56X6u+s2XInDkOCHmc7mzbvour\/VaMu7QmXpnzMUuW0gKWujjoCGCtj6I3g4cdHHao8x7nfej5qgOPG\/y5\/9TmpgmdBQDkpSEhvXjgKIMCQzuCFMUwcpoJ4ETmbFGxyF0Qw6BSdP6ieMTrc4oScWoLwtDwaGkgfUp+Roia7NwCIWw4lV4tli2fie9DBCyPjYtFm4O+35ScQonrNgqNjxPeRZzzCzjnZ4fNZfJBKvJuQu2NGeskZn0IHpz2WNvYiKpvZGSyh\/mI0+WmoLPAaOns7Ga0Z\/\/BChQinLpgszh\/y2FjgAAMAjIwCohBqqqB11jH2Ipjq7xTp4WMxf34HExyaG04ykKR25K64yxCH3I2fm2iHD0eB5vxa9dT3Ko1tHRZrJjwcMAZOieMAgIbkh87zkn0exQ9OyaPlofDji5dzalTp05+EtXU1xR0Ftgb33LhOYBQhOxEG8JmYQwuXoIAF7jnPJHVHcs4WXcsM7vuOJClemRw4avj614IwlzRMcDgfnwOejoUHfQ8VB2H+kN7e\/u2bAS9dRs2PYXX0eNjV6wSJ7sLoxZR+LwF4njbLyBQDDk44kbYNyCPfs9qr5tVd9HyTExNX7Rq185Mm582tBdaunl6DuIQfJW6Yzft3L1PbBLG2H\/oiNh46s49F7lA9uSW1dbBwaFNY2Ay7QKDQnzVhOFpGBOk96YdEGMsQn1r6k6E+hP2\/p9+foEu6O9xK1ez11fQIu7xyHeu+OJoGwMOTnedXWYKmYuc1yTfk8lbCfKs9szMIHeLJcqWp82xARq8QC5GRi1awBupWrtuQxUXoOr1Gzff2Zicci9p85aazVu23w2fH+E9fPjwb9gAf2sKCOnI6OgIGA6Ed+\/dL4wJ0tu27xQ9HSe4EDVxq+MrEQEsZzcsWx4nCh1+0eHvEXM98h0nO9zuxIADlYcJDzmvTV5IXbMuUHukp6e3ljl9oU1YG9oLLXgzXzN+7dOnjxG3GncOvT0LFkYVLIyKORMVs6SQ5eexuNVr0ngaS1u5Jj5t9Zq1aRyyb8CvV8UnZLB3n2FogZdR1DZv2SZObiBmONTFCQ5fSxELo9Ktra2\/8\/DxGeDh4eUzw9XVd+r06b6TJ0+dNcbJaQtCHvk+Zdp08csODjdQ7dUFj\/P9nJGRUaCBgaGvnp6Bb4cOer4dO3b05PanL1HJ3bdBZ4GJfzrc0bFL+LyIY6y4XqMKQ31xRIiNo0DxtCaqNAihVaFwvcFW4d1NyVvEz1TwMloZj8riNzvkN4ob2ppsaSx5+\/qGIPIkys3W\/4rbtWvXLxxHj47BoQZCfuy48eJcD9Ndf5a4ONvD4aaxsfFsifJw462\/AjeFBi9AnkO4H+ddFX5YQOvBMROGDhSluJVrxM9OIIF8BSF4UokN9c+xviZBSRYGBGHIV7QzGX8ewpynOIR5HX9nJ+1NAWyAbzjUM+F1dcgPGjyE7Pv1F9MdJC4rvdc82PSQvCfZxqD54mNbe3tzHz\/\/KpyoQmyg+kJvIyexYRgElRkkUKiQsyAFb9YjVrkGo+EHyiV8PUtYbmVLREVHYcMAg+I209Vdxh5scKavhoGBQTsO97qRIx3JwWGYGGtFvvfqzaOtNev7bqj01\/naf2nf+yGof8J6+Z+TpkzLw0kqig4GDJysYtIKnTNXbBgGmcf9GIIkYmG0MAxIIVrqwa+xjvdBFv0bBS2MR1b8VI12htHV1c0jzdTUFJtvob0pRksrK6uRyPVBXOjgdag7hLwodhaWyoONzoY7Je8QOu+C+sln\/QYMCEZvxWEC+qwrV10PL2\/y9pklWpB\/gFQYRMotCUbhx4csSq6xJC0NCNKCNKjUPyCo1M9fWsr3lvrM8iv18plV6u7pfdFlpuuR0aPHuhkaGv5D0jh5sR+bnj1jMc6i0Km9ziFPXVngoNKbmJhShw4dZkneIXTeBfGnffv2bRyGDqtEhUWxwQ8JUFkwBvoujpjwCwuiw9Pbh6Y5u+R0tbIyMjMz+5lz9af3BUhze8I53ls3\/eeff37L3j6FWR65DnFjbmFBXdjrmOmNjU3I0MjoZatW7bpq3\/uhwJ9PLC0t\/dBWcIKCsMOPiEpjOBGPmeJ\/VsAg+ImZyZOdvX0I5+5\/M5mfYQRtYP1tUHn\/U+3NqMGFrT17\/BHC3YLDHbIW4gZeNzI2ZvLGpG9gcEmiOtj8T4A\/37KFs1FZUWQQdgM1jAG1hfYDg0B94ayNX9\/m1+Wjx4wTGDPOqR6jAV7D+wDP6OVs0HL+nHKHYcPL+XPLOa9LWKf\/or0ZFVpyPZqAQwyEu5kq3OF1IyOQNyJDQyPW+fopEtW53n+Cj1q3bt3J3KLbExwbWXO4Id+Uxugrig\/GSyguGATVGEZBS4JhECkwjjawPmLEKBo+fKS4Hv8pAfcPGjREKWD62BWxUEEU6GyI8UXnzkYJgripLnE1OG1dJW+Z898XH3Xo1MnFrEsXYW2EGyap7mwM5B6GC+ShbZ8+ohjheBlGQZTAMCADwED1UK3hfQgWXI\/7EF0QL7358ywsLNZImpapP7COP9cUcYCr\/\/NWrVoZNnLvBwPtLwnaGdZGnqHQwBhoNZipUYCUBrEWbQhGQZTAMCCDaNEBr+N9XIfrcR8MiqNp5DX3+NGSJmQqR6QBk3zWGHE19AwMFHxtUxH0QWADGOxHUYG1YfV6Y3C1RRjWG4QHDUQIjIIfGLpZAd0FIavuQA\/Vo3IN7yGacD3yGVUcYyp\/Zk2bNm3aaW9EhY\/\/6NDBWZuwNjp21EuUNB1BHwS0wH48RBzQ09dPB\/QFOqfrd+6c3lnAMJ1DMp2\/OJ29km5kZKKEiUm6iYBpI1C+L8DX4j7cz59zlL2Hk9mmxMtfuDi6sFNO8p5yGgO\/l8Vtsr+kiQj6UOAPPggtCQPF\/wfeqgFU7+O6z5sA3vs\/IQ\/oLDQ36Cw0N+gsNDfoLDQ36Cw0N+gsNDfoLDQ36Cw0N+gsNDfoLDQ36Cw0N+gsNDf8L3YsC9MqNY3QAAAAAElFTkSuQmCC"

var mc_username;
var mc_password;
var updatemessage;
var discordBotToken;
var savelogin;
var secrets;
var accountType;
let launcherPath;
let c = 150;
let finishedQueue = !config.get("minecraftserver.is2b2t");
let dc;
const rl = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout
});
const promisedQuestion = (text) => {
	return new Promise((resolve) => rl.question(text, resolve))
}
const guessLauncherPath = () => {
	const appdata = process.env.APPDATA
	return appdata ? `${appdata}/.minecraft` : (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support/minecraft` : `${process.env.HOME}/.minecraft`)
}
const askForSecrets = async () => {
	let localConf = {};
	try {
		localConf = util.readJSON("config/local.json");
	} catch(err) {
		if(err.code != "ENOENT") throw err;
	}
	let canSave = false;
	if(!(config.has("username") && config.has("mcPassword") && config.has("updatemessage") || config.has("profilesFolder"))) {
		canSave = true;
		let shouldUseTokens = (await promisedQuestion("Do you want to use launcher account data? Y or N [N]: ")).toLowerCase() === 'y';

		if (!shouldUseTokens) {
			accountType = ((await promisedQuestion("Account type, mojang (1) or microsoft (2) [1]: ")) === "2" ? "microsoft" : "mojang");
			mc_username = await promisedQuestion("Email: ");
			mc_password = await promisedQuestion("Password: ");
			localConf.accountType = accountType;
			localConf.mcPassword = mc_password;
			updatemessage = await promisedQuestion("Update Messages? Y or N [Y]: ");
			localConf.updatemessage = updatemessage;

		} else {
			mc_username = await promisedQuestion("Nickname (NOT an email!): ");
			launcherPath = (await promisedQuestion("Path to Minecraft Launcher data folder, leave blank to autodetect []: ")) || guessLauncherPath();
			localConf.launcherPath = launcherPath;


		}
		localConf.username = mc_username;
	}
	if((!config.has("discordBot") || config.get("discordBot")) && !config.has("BotToken")) {
		canSave = true;
		discordBotToken = await promisedQuestion("BotToken, leave blank if not using discord []: ");
		localConf.BotToken = discordBotToken;
	}
	localConf.discordBot = discordBotToken === "" ? false : config.has("discordBot") && config.get("discordBot");

	if(canSave) {

		savelogin = await promisedQuestion("Save login for later use? Y or N [N]: ");
		if (savelogin.toLowerCase() === "y") {
			fs.writeFile('config/local.json', JSON.stringify(localConf, null, 2), (err) => {
				if (err) console.log(err);
			});
		};
		console.clear();
	}
	if (localConf.discordBot) {
		dc = new discord.Client();
		dc.login(discordBotToken??config.get('BotToken')).catch(()=>{
			console.warn("There was an error when trying to log in using the provided Discord bot token. If you didn't enter a token this message will go away the next time you run this program!"); //handle wrong tokens gracefully
		});
		dc.on('ready', () => {
			dc.user.setActivity("Queue is stopped.");
			fs.readFile(save, "utf8", (err, id) => {
				if(!err) dc.users.fetch(id).then(user => {
					dcUser = user;
				});
			});
		});

		dc.on('message', msg => {
			if (msg.author.username !== dc.user.username) {
				userInput(msg.content, true, msg);
				if (dcUser == null || msg.author.id !== dcUser.id) {
					fs.writeFile(save, msg.author.id, function (err) {
						if (err) {
							throw err;
						}
				});
			}
			dcUser = msg.author;
		}
	});
}
	console.log("Starting 2b2w");
	cmdInput();
	joinOnStart();
}

if(!config.get("minecraftserver.onlinemode")) cmdInput();
else {
	mc_username = config.username;
	mc_password = config.mcPassword;
	launcherPath = config.profilesFolder;
	accountType = config.get("accountType");
	discordBotToken = config.BotToken
	askForSecrets();
}

var stoppedByPlayer = false;
var timedStart;
let dcUser; // discord user that controlls the bot
var totalWaitTime;
var starttimestring;
var options;
var doing;
let interval = {};
let queueStartPlace;
let queueStartTime;
webserver.restartQueue = config.get("reconnect.notConnectedQueueEnd");
webserver.onstart(() => { // set up actions for the webserver
	startQueuing();
});
webserver.onstop(() => {
	stopQueing();
});
if (config.get("webserver")) {
	let webPort = config.get("ports.web");
	webserver.createServer(webPort, config.get("address.web")); // create the webserver
	webserver.password = config.password
	if(config.get("openBrowserOnStart")) opn('http://localhost:' + webPort); //open a browser window
}
// lets
let proxyClient; // a reference to the client that is the actual minecraft game
let client; // the client to connect to 2b2t
let server; // the minecraft server to pass packets
let conn; // connection object from mcproxy for the client variable

options = {
	host: config.get("minecraftserver.hostname"),
	port: config.get("minecraftserver.port"),
	version: config.get("minecraftserver.version")
}

function startAntiAntiAFK(){
	if (!config.has("antiAntiAFK.enabled") || !config.get("antiAntiAFK.enabled")) return;
	if(proxyClient != null || !webserver.isInQueue || !finishedQueue) return;
	conn.bot.afk.start();
}

function cmdInput() {
	rl.question("$ ", (cmd) => {
		userInput(cmd, false);
		cmdInput();
	});
}

// function to disconnect from the server
function stop() {
	webserver.isInQueue = false;
	finishedQueue = !config.minecraftserver.is2b2t;
	webserver.queuePlace = "None";
	webserver.ETA = "None";
	if(client){
		client.end(); // disconnect
	}
	if (proxyClient) {
		proxyClient.end("Stopped the proxy."); // boot the player from the server
	}
	if(server){
		server.close(); // close the server
	}
}

// function to start the whole thing
function startQueuing() {
	stopQueing();
	doing = "auth";
	if (config.get("minecraftserver.onlinemode")) {
		options.username = mc_username;
		options.password = mc_password;
		options.profilesFolder = launcherPath;
		options.auth = accountType;
	} else {
		options.username = config.get("minecraftserver.username");
	}
	conn = new mcproxy.Conn(options);// connect to 2b2t
	client = conn.bot._client;
	conn.bot.loadPlugin(antiafk);
	conn.bot.afk.setOptions(config.get("antiAntiAFK").get("config"));
	join();
}

function join() {
	let positioninqueue = "None";
	let lastQueuePlace = "None";
	let notisend = false;
	doing = "queue"
	webserver.isInQueue = true;
	startAntiAntiAFK(); //for non-2b2t servers
	activity("Starting the queue...");
	client.on("packet", (data, meta) => { // each time 2b2t sends a packet
		switch (meta.name) {
			case "playerlist_header":
				if (!finishedQueue && config.minecraftserver.is2b2t) { // if the packet contains the player list, we can use it to see our place in the queue
					let headermessage = JSON.parse(data.header);
                                        let positioninqueue = "None";
                                        try{
                                            positioninqueue = headermessage.text.split("\n")[5].substring(25);
				        }catch(e){
                                            if (e instanceof TypeError)
                                                console.log("Reading position in queue from tab failed! Is the queue empty, or the server isn't 2b2t?");
                                        }
					if(positioninqueue !== "None") positioninqueue = Number(positioninqueue);
					webserver.queuePlace = positioninqueue; // update info on the web page
					if(lastQueuePlace === "None" && positioninqueue !== "None") {
						queueStartPlace = positioninqueue;
						queueStartTime = DateTime.local();
					}
					if (positioninqueue !== "None" && lastQueuePlace !== positioninqueue) {
						let totalWaitTime = getWaitTime(queueStartPlace, 0);
						let timepassed = getWaitTime(queueStartPlace, positioninqueue);
						let ETAmin = (totalWaitTime - timepassed) / 60;

                                                var req = new XMLHttpRequest();
                                                req.open("GET", "https://api.mcsrvstat.us/1/2b2t.org", false);
                                                req.send(null);
                                                var res = req.responseText;
                                                var json = JSON.parse(res);
                                                var motd = `${json.motd.raw[0]}` ?? `\u00a77\u00a7o\u00a7l2B \u00a7r`;
						server.motd = `${motd}\n\u00a7r\u00a77\u00a7o\u00a7l2T \u00a7rPlay in ${webserver.ETA} (${webserver.queuePlace})`; // set the MOTD because why not
						webserver.ETA = Math.floor(ETAmin / 60) + "h " + Math.floor(ETAmin % 60) + "m";
						if (config.get("userStatus")) { //set the Discord Activity
							logActivity(webserver.ETA + " (" + positioninqueue + ") - " + options.username);
						} else {
							logActivity("P: " + positioninqueue + " E: " + webserver.ETA);
						}
						if (config.get("notification.enabled") && positioninqueue <= config.get("notification.queuePlace") && !notisend && config.discordBot && dcUser != null) {
							sendDiscordMsg(dcUser, "", "You're in position " + webserver.queuePlace + " of the 2b2t queue. Join now!");
							notisend = true;
						}
					}
					lastQueuePlace = positioninqueue;
				}
				break;
			case "chat":
				if (finishedQueue === false) { // we can know if we're about to finish the queue by reading the chat message
					// we need to know if we finished the queue otherwise we crash when we're done, because the queue info is no longer in packets the server sends us.
					let chatMessage = JSON.parse(data.message);
					if (chatMessage.text && chatMessage.text === "Connecting to the server...") {
						if(config.get("expandQueueData")) {
							queueData.place.push(queueStartPlace);
							let timeQueueTook = DateTime.local().toSeconds() - queueStartTime.toSeconds();
							let b = Math.pow((0 + c)/(queueStartPlace + c), 1/timeQueueTook);
							queueData.factor.push(b);
							fs.writeFile("queue.json", JSON.stringify(queueData), "utf-8", (err) => {
								log(err);
							});
						}
						if (webserver.restartQueue && proxyClient == null) { //if we have no client connected and we should restart
							stop();
						} else {
							finishedQueue = true;
							startAntiAntiAFK();
							webserver.queuePlace = "FINISHED";
							webserver.ETA = "NOW";
							logActivity("Queue is finished");
						}
					}
				}
				break;
		}
	});

	// set up actions in case we get disconnected.
	const onDisconnect = () => {
		if (proxyClient) {
			proxyClient.end("Disconnected from 2b2t server.\nReconnecting...");
			proxyClient = null
		}
		stop();
		if (!stoppedByPlayer) {
			log(`Disconnected from 2b2t server. Reconnecting...`);
			if (!config.has("MCpassword") && !config.has("password")) log("If this ^^ message shows up repeatedly, it is likely a problem with your token being invalidated. Please start minecraft manually or use credential authentication instead.");
		}
		if (config.reconnect.onError) setTimeout(reconnect, 30000);
	}
	client.on('end', onDisconnect);
	client.on('error', onDisconnect);

	server = mc.createServer({ // create a server for us to connect to
		'online-mode': config.get("whitelist"),
		encryption: true,
		host: config.get("address.minecraft"),
		port: config.get("ports.minecraft"),
		version: config.MCversion,
		'max-players': maxPlayers = 1,
                favicon: faviconbase64
	});

	server.on('login', (newProxyClient) => { // handle login
		if(config.whitelist && client.uuid !== newProxyClient.uuid) {
			newProxyClient.end("not whitelisted!\nYou need to use the same account as 2b2w or turn the whitelist off");
			return;
		}
		newProxyClient.on('packet', (data, meta, rawData) => { // redirect everything we do to 2b2t
			filterPacketAndSend(rawData, meta, client);
		});
		newProxyClient.on("end", ()=>{
			proxyClient = null;
			startAntiAntiAFK();
		})
		conn.bot.afk.stop().then(()=>{
			conn.sendPackets(newProxyClient);
			conn.link(newProxyClient);
			proxyClient = newProxyClient;
		});
	});
}


function log(logmsg) {
	if (config.get("logging")) {
		fs.appendFile('2bored2wait.log', DateTime.local().toLocaleString({
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}) + "	" + logmsg + "\n", err => {
			if (err) console.error(err)
		})
	}
	let line = rl.line;
	process.stdout.write("\033[F\n" + logmsg + "\n$ " + line);
}

function reconnect() {
	doing = "reconnect";
	if (stoppedByPlayer) stoppedByPlayer = false;
	else {
		logActivity("Reconnecting... ");
		reconnectLoop();
	}
}

function reconnectLoop() {
	mc.ping({host: config.minecraftserver.hostname, port: config.minecraftserver.port}, (err) => {
		if(err) setTimeout(reconnectLoop, 3000);
		else startQueuing();
	});
}

//function to filter out some packets that would make us disconnect otherwise.
//this is where you could filter out packets with sign data to prevent chunk bans.
function filterPacketAndSend(data, meta, dest) {
	if (meta.name !== "keep_alive" && meta.name !== "update_time") { //keep alive packets are handled by the client we created, so if we were to forward them, the minecraft client would respond too and the server would kick us for responding twice.
		dest.writeRaw(data);
	}
}

function round(number) {
	if (number > 0) return Math.ceil(number);
	else return Math.floor(number);
}

function activity(string) {
	dc?.user?.setActivity(string);
}

//the discordBot part starts here.

function userInput(cmd, DiscordOrigin, discordMsg) {
	 cmd = cmd.toLowerCase();

	switch (cmd) {
		case "start":
			startQueuing();
			msg(DiscordOrigin, discordMsg, "Queue is starting up", "");
                        process.stdout.write("Queue is starting up\n$ ");
			break;

		case "exit":
		case "quit":
                        activity("Exited");
			return process.exit(0);

		case "update":
			switch (doing) {
				case "queue":
					if (DiscordOrigin) {
                                            discordMsg.channel.send(`Play in **${webserver.ETA}** (${webserver.queuePlace})`)
					} else { console.log("Position: " + webserver.queuePlace + "  Estimated time until login: " + webserver.ETA); };
					break;
				case "timedStart":
					msg(DiscordOrigin, discordMsg, "Timer is set to " + starttimestring, "");
					break;
				case "reconnect":
					msg(DiscordOrigin, discordMsg, "", "2b2t is currently offline. Trying to reconnect...");
					break;
				case "auth":
					let authMsg = "Authentication";
					msg(DiscordOrigin, discordMsg, authMsg, authMsg);
					break;
				case "calcTime":
					let calcMsg = msg(DiscordOrigin, discordMsg, "Play in **" + starttimestring + "**", "");
					break;
			}
			break;
		case "stop":
			switch (doing) {
				case "queue":
					stopQueing();
					stopMsg(DiscordOrigin, discordMsg, "Queue");
					break;
				case "timedStart":
					clearTimeout(timedStart);
					stopMsg(DiscordOrigin, discordMsg, "Timer");
					break;
				case "reconnect":
					clearInterval(interval.reconnect);
					stopMsg(DiscordOrigin, discordMsg, "Reconnecting");
					break;
				case "auth":
					clearInterval(interval.auth);
					stopMsg(DiscordOrigin, discordMsg, "Authentication");
					break;
				case "calcTime":
					clearInterval(interval.calc);
					stopMsg(DiscordOrigin, discordMsg, "Time calculation");
					break;
			}
                        process.stdout.write("Stopping 2b2w queueing\n$ ");
			break;
		default:
			if (/start (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd)) {
				doing = "timedStart"
				timedStart = setTimeout(startQueuing, timeStringtoDateTime(cmd).toMillis() - DateTime.local().toMillis());
				activity("Starting at " + starttimestring);
				msg(DiscordOrigin, discordMsg, "Queue is starting at " + starttimestring, "");
			} else if (/^play (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd)) {
				timeStringtoDateTime(cmd);
				calcTime(cmd);
				msg(DiscordOrigin, discordMsg, "Queueing for **" + starttimestring + "**", "");
				activity("You can play at " + starttimestring);
			}
			else msg(DiscordOrigin, discordMsg, "Unknown command", "*Silly goose*");
	}
}

function stopMsg(discordOrigin, discordMsg, stoppedThing) {
	msg(discordOrigin, discordMsg, stoppedThing + " is **stopped**", "");
	activity(stoppedThing + " is stopped.");
}

function msg(discordOrigin, msg, title, content) {
	if(discordOrigin) sendDiscordMsg(msg.channel, title, content);
	else console.log(content);
}

function sendDiscordMsg(channel, title, content) {
	channel.send(title + "\n" + content);
}

function timeStringtoDateTime(time) {
	starttimestring = time.split(" ");
	starttimestring = starttimestring[1];
	let starttime = starttimestring.split(":");
	let startdt = DateTime.local().set({hour: starttime[0], minute: starttime[1], second: 0, millisecond: 0});
	if (startdt.toMillis() < DateTime.local().toMillis()) startdt = startdt.plus({days: 1});
	return startdt;
}

function calcTime(msg) {
	doing = "calcTime"
	interval.calc = setInterval(function () {
		https.get("https://2b2t.io/api/queue", (resp) => {
			let data = '';
			resp.on('data', (chunk) => {
				data += chunk;
			});
			resp.on("end", () => {
				data = JSON.parse(data);
				let queueLength = data[0][1];
				let playTime = timeStringtoDateTime(msg);
				let waitTime = getWaitTime(queueLength, 0);
				if (playTime.toSeconds() - DateTime.local().toSeconds() < waitTime) {
					startQueuing();
					clearInterval(interval.calc);
					console.log(waitTime);
				}
			});
		}).on("error", (err) => {
			log(err)
		});
	}, 60000);

}


function stopQueing() {
	stoppedByPlayer = true;
	stop();
}

function logActivity(update) {
	activity(update);
	log(update);
}

function joinOnStart() {
	if(config.get("joinOnStart")) setTimeout(startQueuing, 1000);
}

function getWaitTime(queueLength, queuePos) {
	let b = everpolate.linear(queueLength, queueData.place, queueData.factor)[0];
	return Math.log((queuePos + c)/(queueLength + c)) / Math.log(b); // see issue 141
}
module.exports = {
	startQueue: function () {
		startQueuing();
	},
	filterPacketAndSend: function () {
		filterPacketAndSend();
	},
	stop: function () {
		stopQueing();
	}
};
