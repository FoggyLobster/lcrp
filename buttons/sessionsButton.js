module.exports = {
  customId: "session_role",

  async execute(interaction) {
    const role_id = "1533618970807238798";

    const alreadyHasRole = interaction.member.roles.cache.has(role_id);

    if (alreadyHasRole) {
      await interaction.member.roles.remove(role_id);

      return interaction.reply({
        content: "Removed the sessions role successfully.",
        ephemeral: true,
      });
    }

    await interaction.member.roles.add(role_id);

    return interaction.reply({
      content: "Added the sessions role successfully.",
      ephemeral: true,
    });
  },
};
