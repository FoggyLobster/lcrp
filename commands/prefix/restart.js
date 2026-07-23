const { exec } = require("child_process");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "restart",
  description: "Restarts the bot.",
  async execute(message, args) {
    const isOwner = message.member.id === "1062166609931804702";
    if (!isOwner) {
      return message.reply("You do not have permission to use this command.");
    }

    const msg = await message.reply("Restarting...");

    exec("pm2 restart lcrp", (error, stdout, stderr) => {
      if (error) {
        return message.reply(
          `Failed to restart bot:\n\`\`\`\n${error.message}\n\`\`\``,
        );
      }

      const output = (stdout || stderr).trim();

      if (!output) {
        return message.reply("No output found.");
      }
    });

    await msg.edit("Restarted.");
  },
};
