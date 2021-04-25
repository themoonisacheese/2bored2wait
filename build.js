const { compile } = require("nexe");
["linux", "alphine", "windows"].forEach((os) => {
	["x86", "x64"].forEach((arch) => {
		build(`${os}-${arch}`);
	});
});
build("macos-x64");

function build(platform) {
	compile({
		resources: ["webserver/index*", "config/config.json.example", "config/secrets.json.example", "node_modules/discord.js/src"],
		name: `build/2bored2wait-${platform}`,
		target: `${platform}-14.15.3`
	});
}
