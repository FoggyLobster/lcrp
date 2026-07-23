const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  const prefixPath = path.join(__dirname, "../commands/prefix");
  const prefixFiles = fs
    .readdirSync(prefixPath)
    .filter((f) => f.endsWith(".js"));

  for (const file of prefixFiles) {
    const cmd = require(`../commands/prefix/${file}`);
    client.prefixCommands.set(cmd.name, cmd);
  }

  client.slashCommands = new Map();

  const slashPath = path.join(__dirname, "../commands/slash");
  const slashFiles = fs.readdirSync(slashPath).filter((f) => f.endsWith(".js"));

  for (const file of slashFiles) {
    const cmd = require(`../commands/slash/${file}`);
    client.slashCommands.set(cmd.data.name, cmd);
  }
};
