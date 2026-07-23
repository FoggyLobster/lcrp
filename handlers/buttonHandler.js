const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.buttons = new Map();

  const dir = path.join(__dirname, "../buttons");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const btn = require(`../buttons/${file}`);
    client.buttons.set(btn.customId, btn);
  }
};
