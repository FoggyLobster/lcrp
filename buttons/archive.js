const db = require("../db");

module.exports = {
  customId: "archive",

  async execute(interaction) {
    db.prepare(
      `
      DELETE FROM staff_results
    `,
    ).run();

    await interaction.reply({
      content: "Successfully archived all applications.",
      ephemeral: true,
    });
  },
};
