const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.modals = new Map();

  const dir = path.join(__dirname, "../modals");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const modal = require(`../modals/${file}`);
    client.modals.set(modal.customId, modal);
  }
};
