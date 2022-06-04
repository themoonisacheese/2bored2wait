const fs = require("fs");
const util = require("./util");
const os = require("os");
const path = require("path");
let dir = `${os.homedir()}/.config/2bored2wait`
util.mkdir(`${dir}/config`);
process.chdir(dir);
require("./check");
