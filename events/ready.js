const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({
      activities: [
        {
          name: "Lakeshore County Roleplay",
          type: ActivityType.Watching,
        },
      ],
      status: "dnd",
    });
  },
};
