const { SlashCommandBuilder } = require("discord.js");
const db = require("../../db");

const mod_roles = [];
const admin_roles = [];
const ia_roles = [];
const manager_roles = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("promotion")
    .setDescription("Promote a user to a rank.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("issue")
        .setDescription("Issue a promotion.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to promote.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("rank")
            .setDescription("The rank to promote to.")
            .setRequired(true)
            .addChoices(
              { name: "Moderator", value: "Moderator" },
              { name: "Senior Moderator", value: "Senior Moderator" },
              { name: "Administrator", value: "Administrator" },
              { name: "Senior Administrator", value: "Senior Administrator" },
              { name: "Internal Affairs", value: "Internal Affairs" },
              { name: "Manager", value: "Manager" },
              { name: "Senior Manager", value: "Senior Manager" },
              { name: "Community Lead", value: "Community Lead" },
            ),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "issue") {
      const user = interaction.options.getUser("user");

      const rank = interaction.options.getString("rank");

      const previousRank = db
        .prepare(
          `
                SELECT *
                FROM ranks
                WHERE user_id = ?
                `,
        )
        .get(user.id);
    }
  },
};
