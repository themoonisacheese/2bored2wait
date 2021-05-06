const fs = require("fs");
const util = require("./util");
const os = require("os");
const path = require("path");
let dir = `${os.homedir()}/.2bored2wait`
util.mkdir(`${dir}/config`);
process.chdir(dir);
process.env.NODE_CONFIG_DIR = `./config${path.delimiter}nexe-conf`;
require("./check");
