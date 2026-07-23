const { exec } = require("child_process");

module.exports = {
  name: "restart",

  async execute(message) {
    const isOwner = message.member.id === "1062166609931804702";

    if (!isOwner) {
      return message.reply("How bout no.");
    }

    const msg = await message.reply("Restarting, please wait...");

    setTimeout(() => {
      exec("git pull && pm2 restart lcrp", (error) => {
        if (error) {
          console.error("PM2 sync failed:", error);
        }
      });
    }, 1000);

    msg.edit("Restarted Successfully!");
  },
};
