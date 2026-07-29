const db = require("../../db");

module.exports = {
  name: "execute",

  async execute(client, message, args) {
    if (
      !message.member.permissions.has("ModerateMembers") &&
      !message.member.permissions.has("KickMembers")
    ) {
      return message.reply("You do not have permission to use this command.");
    }

    const type = args[0]?.toLowerCase();

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

    if (
      member.roles.highest.position >= message.member.roles.highest.position &&
      message.guild.ownerId !== message.author.id
    ) {
      return message.reply("You cannot execute that user.");
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
          "Valid execution types are: firing, electric, beheading.",
        );
    }
  },
};