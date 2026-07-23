require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");

const commands = [];
const files = fs
  .readdirSync("./commands/slash")
  .filter((f) => f.endsWith(".js"));

for (const file of files) {
  const cmd = require(`./commands/slash/${file}`);
  commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Deploying slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      { body: commands },
    );

    console.log("Done deploying.");
  } catch (err) {
    console.error(err);
  }
})();
