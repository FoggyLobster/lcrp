const db = require("../../db");

module.exports = {
  name: "cleardb",
  description: "Clears a database table",

  async execute(client, message, args) {
    const isOwner = message.member.roles.cache.has("1062166609931804702");

    if (!isOwner) {
      return message.reply("You do not have permission to use this command.");
    }

    switch (args[0]?.toLowerCase()) {
      case "tickets": {
        db.prepare(
          `
                DELETE FROM tickets
            `,
        ).run();

        return message.reply("Successfully cleared tickets table.");
      }

      default: {
        return message.reply("Usage: `!cleardb <db name>`");
      }
    }
  },
};
