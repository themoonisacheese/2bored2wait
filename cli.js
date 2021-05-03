const fs = require("fs");
const util = require("./util");
let dir = `${process.env.HOME}/.2bored2wait`
util.mkdir(`${dir}/config`);
process.chdir(dir);
process.env.NODE_CONFIG_DIR = `./config:./nexe-conf`;
require("./main");
