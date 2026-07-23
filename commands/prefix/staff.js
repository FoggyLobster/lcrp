const db = require("../../db");

module.exports = {
  name: "staff",

  async execute(client, message, args) {
    if (!message.member) {
      return message.reply("Could not find your server member data.");
    }

    const isHR = message.member.roles.cache.has("1529307162638028811");
    const isAdmin = message.member.permissions.has("Administrator");

    if (!isHR && !isAdmin) {
      return message.reply("You do not have permission to use this command.");
    }

    const STAFF_ROLE_IDS = [
      "1529514752450101498",
      "1529308725456797936",
      "1529323665152540692",
    ];

    const staffRoles = STAFF_ROLE_IDS.map((id) =>
      message.guild.roles.cache.get(id),
    );

    if (!staffRoles.every((role) => role)) {
      return message.reply("Could not find all staff roles.");
    }

    switch (args[0]?.toLowerCase()) {
      case "add": {
        const userId = args[1];

        if (!userId) {
          return message.reply("Provide a user ID.");
        }

        const member = await message.guild.members
          .fetch(userId)
          .catch(() => null);

        if (!member) {
          return message.reply("That user is not in this server.");
        }

        await member.roles.add(staffRoles);

        return message.reply(
          `Successfully added staff roles to <@${member.id}>`,
        );
      }

      case "remove": {
        const userId = args[1];

        if (!userId) {
          return message.reply("Provide a user ID.");
        }

        const member = await message.guild.members
          .fetch(userId)
          .catch(() => null);

        if (!member) {
          return message.reply("That user is not in this server.");
        }

        await member.roles.remove(staffRoles);

        return message.reply(
          `Successfully removed staff roles from <@${member.id}>`,
        );
      }

      case "accept": {
        const userId = args[1];
        const notes = args[2];

        if (!userId) {
          return message.reply("Provide a user ID.");
        }

        const member = await message.guild.members
          .fetch(userId)
          .catch(() => null);

        if (!member) {
          return message.reply("That user is not in this server.");
        }

        db.prepare(
          `
          INSERT INTO staff_results (user_id, result, notes)
          VALUES (?, ?, ?)
          `,
        ).run(member.id, "accepted", notes);

        await member.send({
          content: `<:scroll:1529617603327430898> Your application in **Lakeshore County Roleplay** has been accepted.\n**Notes:** ${notes}`,
        });

        return message.reply(
          `Successfully accepted staff application for <@${member.id}>`,
        );
      }

      case "deny": {
        if (!isHR && !isAdmin) {
          return message.reply(
            "You do not have permission to use this command.",
          );
        }

        const userId = args[1];
        const notes = args[2];

        if (!userId) {
          return message.reply("Provide a user ID.");
        }

        const member = await message.guild.members
          .fetch(userId)
          .catch(() => null);

        if (!member) {
          return message.reply("That user is not in this server.");
        }

        db.prepare(
          `
          INSERT INTO staff_results (user_id, result, notes)
          VALUES (?, ?, ?)
          `,
        ).run(member.id, "denied", notes);

        await member.send({
          content: `<:scroll:1529617603327430898> Your application in **Lakeshore County Roleplay** has been denied.\n**Notes:** ${notes}`,
        });

        return message.reply(
          `Successfully denied staff application for <@${member.id}>`,
        );
      }

      default:
        return message.reply(
          "Usage: `!staff <add|remove|accept|deny> <user ID> <notes (only for accept/deny)>`",
        );
    }
  },
};
