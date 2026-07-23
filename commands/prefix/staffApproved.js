const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const db = require("../../db");

module.exports = {
  name: "apps",

  async execute(client, message, args) {
    switch (args[0]?.toLowerCase()) {
      case "approved": {
        const approvedApplications = db
          .prepare(
            `
            SELECT *
            FROM staff_results
            WHERE result = ?
          `,
          )
          .all("accepted");

        if (approvedApplications.length === 0) {
          return message.reply("No approved applications.");
        }

        const embed = new EmbedBuilder()
          .setTitle("Approved Applications")
          .setColor("Green");

        const description = approvedApplications
          .map((application) => {
            const user = message.guild.members.cache.get(application.user_id);

            if (!user) {
              return `Unknown User (${application.user_id})`;
            }

            return `${user.user.tag} (${user.id})`;
          })
          .join("\n");

        embed.setDescription(description);

        const roleButton = new ButtonBuilder()
          .setCustomId("role_users")
          .setLabel("Role Users")
          .setStyle(ButtonStyle.Success);

        const archiveButton = new ButtonBuilder()
          .setCustomId("archive")
          .setLabel("Archive")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(
          roleButton,
          archiveButton,
        );

        return message.reply({
          embeds: [embed],
          components: [row],
        });
      }

      default:
        return message.reply("Usage: `!apps approved`");
    }
  },
};
