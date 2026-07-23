const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.menus = new Map();

  const dir = path.join(__dirname, "../menus");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const menu = require(`../menus/${file}`);
    client.menus.set(menu.customId, menu);
  }
};
