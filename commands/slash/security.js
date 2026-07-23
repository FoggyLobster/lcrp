const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../db.js");

const QUARANTINE_ROLE_ID = "1529564114387603537";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("security")
    .setDescription("Commands relating to security")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("quarantine")
        .setDescription("Quarantine a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to quarantine")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for quarantining the user")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unquarantine")
        .setDescription("Restore a user's roles")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to restore")
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "quarantine") {
      const isAdmin = interaction.member.permissions.has("Administrator");
      const isOwner = interaction.user.id === "1062166609931804702";

      if (!isOwner && !isAdmin) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });
      }

      if (interaction.user.id !== "1062166609931804702") {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });
      }

      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");

      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member) {
        return interaction.reply({
          content: "That user is not in this server.",
          ephemeral: true,
        });
      }

      const previousRoles = member.roles.cache
        .filter((role) => role.id !== interaction.guild.id && role.editable)
        .map((role) => role.id);

      db.prepare(
        `
        INSERT OR REPLACE INTO quarantine (user_id, previous_roles, reason)
        VALUES (?, ?, ?)
      `,
      ).run(user.id, JSON.stringify(previousRoles), reason);

      const quarantineRole =
        interaction.guild.roles.cache.get(QUARANTINE_ROLE_ID);

      if (!quarantineRole || !quarantineRole.editable) {
        return interaction.reply({
          content:
            "I cannot manage the quarantine role. Move my bot role above the quarantine role.",
          ephemeral: true,
        });
      }

      await member.roles.set([QUARANTINE_ROLE_ID]);

      await interaction.reply({
        content: `Quarantined ${user.tag}.`,
        ephemeral: true,
      });

      await user
        .send(
          `<:shield:1529560107782897864> You have been quarantined in **Orange Village Roleplay**.\n**Reason:** ${reason}`,
        )
        .catch(() => {});
    }

    if (sub === "unquarantine") {
      const isAdmin = interaction.member.permissions.has("Administrator");
      const isOwner = interaction.user.id === "1062166609931804702";

      if (!isOwner && !isAdmin) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });
      }

      const user = interaction.options.getUser("user");

      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member) {
        return interaction.reply({
          content: "That user is not in this server.",
          ephemeral: true,
        });
      }

      const data = db
        .prepare(
          `
          SELECT previous_roles
          FROM quarantine
          WHERE user_id = ?
        `,
        )
        .get(user.id);

      if (!data) {
        return interaction.reply({
          content: "This user is not quarantined.",
          ephemeral: true,
        });
      }

      const roles = JSON.parse(data.previous_roles);

      const editableRoles = roles.filter((roleId) => {
        const role = interaction.guild.roles.cache.get(roleId);
        return role && role.editable;
      });

      await member.roles.set(editableRoles);

      db.prepare(
        `
        DELETE FROM quarantine
        WHERE user_id = ?
      `,
      ).run(user.id);

      await interaction.reply({
        content: `Restored ${user.tag}.`,
        ephemeral: true,
      });
    }
  },
};
