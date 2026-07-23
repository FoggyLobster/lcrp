const db = require("../db");

module.exports = {
  customId: "role_users",

  async execute(interaction) {
    const apps = db
      .prepare(
        `
        SELECT *
        FROM staff_results
        WHERE result = ?
      `,
      )
      .all("accepted");

    if (apps.length === 0) {
      return interaction.reply({
        content: "No approved applications.",
        ephemeral: true,
      });
    }

    const roles = [
      "1529514752450101498",
      "1529308725456797936",
      "1529323665152540692",
    ];

    const roleObjects = roles.map((id) =>
      interaction.guild.roles.cache.get(id),
    );

    if (!roleObjects.every((role) => role)) {
      return interaction.reply({
        content: "Could not find all staff roles.",
        ephemeral: true,
      });
    }

    const addedUsers = [];

    for (const app of apps) {
      const member = await interaction.guild.members
        .fetch(app.user_id)
        .catch(() => null);

      if (!member) continue;

      await member.roles.add(roleObjects);

      addedUsers.push(`${member.user.tag} (${member.id})`);
    }

    if (addedUsers.length === 0) {
      return interaction.reply({
        content: "No users could be found to role.",
        ephemeral: true,
      });
    }

    return interaction.reply({
      content: `Successfully added staff roles to:\n${addedUsers.join("\n")}`,
      ephemeral: true,
    });
  },
};
