const ms = require("ms");
const db = require("../../db");

const OWNER_ID = "1062166609931804702";

module.exports = {
  name: "execute",

  async execute(client, message, args) {
    if (message.author.id !== OWNER_ID) {
      return;
    }

    const type = args[0]?.toLowerCase();

    if (type === "reverse") {
      const userId = args[1];

      if (!userId) {
        return message.reply("Usage: !execute reverse <user_id>");
      }

      const member = await message.guild.members
        .fetch(userId)
        .catch(() => null);

      if (!member) {
        return message.reply("User not found in this server.");
      }

      const row = db
        .prepare("SELECT * FROM quarantine WHERE user_id = ?")
        .get(userId);

      if (!row) {
        return message.reply("That user is not quarantined.");
      }

      const roles = JSON.parse(row.previous_roles);

      await member.roles.set(roles);

      db.prepare("DELETE FROM quarantine WHERE user_id = ?").run(userId);

      return message.reply(
        `${member.user.tag} has been restored from quarantine.`,
      );
    }

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[1]);

    if (!member) {
      return message.reply(
        "Usage: !execute <firing|electric|beheading> @user [duration]",
      );
    }

    if (member.id === message.author.id) {
      return message.reply("You cannot execute yourself.");
    }

    if (member.id === client.user.id) {
      return message.reply("Nice try.");
    }

    switch (type) {
      case "firing": {
        const previousRoles = member.roles.cache
          .filter((r) => r.id !== message.guild.id)
          .map((r) => r.id);

        db.prepare(
          `
          INSERT OR REPLACE INTO quarantine (user_id, previous_roles, reason)
          VALUES (?, ?, ?)
          `,
        ).run(member.id, JSON.stringify(previousRoles), "Fired");

        await member.roles.set([]);

        return message.reply(
          `${member.user.tag} has been fired and placed into quarantine.`,
        );
      }

      case "electric": {
        const duration = ms(args[2]);

        if (!duration) {
          return message.reply(
            "Provide a valid duration. Example: !execute electric @user 5m",
          );
        }

        await member.timeout(duration);

        return message.reply(
          `${member.user.tag} has been sentenced to the electric chair for ${args[2]}.`,
        );
      }

      case "beheading": {
        await member.kick();

        return message.reply(`${member.user.tag} has been beheaded.`);
      }

      default:
        return message.reply(
          "Valid execution types are: firing, electric, beheading, reverse.",
        );
    }
  },
};
