const { SlashCommandBuilder } = require("discord.js");
const db = require("../../db");

function generateId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id;

  do {
    id = "";

    for (let i = 0; i < 5; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (db.prepare("SELECT 1 FROM infractions WHERE id = ?").get(id));

  return id;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("infraction")
    .setDescription("Manage infractions.")

    .addSubcommand((subcommand) =>
      subcommand
        .setName("issue")
        .setDescription("Add an infraction.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to add an infraction for.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("The type of infraction.")
            .setRequired(true)
            .addChoices(
              { name: "Notice", value: "Notice" },
              { name: "Warning", value: "Warning" },
              { name: "Strike", value: "Strike" },
              { name: "Termination", value: "Termination" },
              { name: "Other", value: "Other" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for the infraction.")
            .setRequired(true),
        ),
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("View a user's infractions.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to view.")
            .setRequired(true),
        ),
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName("void")
        .setDescription("Remove an infraction.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to void the infraction from.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("The infraction ID.")
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "issue") {
      const role_ids = [
        "1529583874202407125",
        "1529584121662144742",
        "1529592813380173864",
      ];
      const hasRole = interaction.member.roles.cache.has(role_ids);

      const isAdmin = interaction.member.permissions.has("Administrator");

      if (!isAdmin && !hasRole) {
        return interaction.reply({
          content: "You do not have permission.",
          ephemeral: true,
        });
      }

      await interaction.deferReply({
        ephemeral: true,
      });

      const user = interaction.options.getUser("user");

      const reason = interaction.options.getString("reason");

      const type = interaction.options.getString("type");

      const id = generateId();

      const previous = db
        .prepare(
          `
        SELECT *
        FROM infractions
        WHERE user_id = ?
      `,
        )
        .all(user.id);

      db.prepare(
        `
        INSERT INTO infractions
        (
          id,
          user_id,
          infraction_type,
          reason,
          issued_by,
          issued_at,
          total_infractions
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        id,
        user.id,
        type,
        reason,
        interaction.user.id,
        Date.now(),
        previous.length + 1,
      );

      await interaction.editReply({
        content: `Successfully added an infraction for ${user}.`,
      });

      try {
        await user.send({
          content: `<:shield:1529560107782897864> You have been infracted in **Lakeshore County Roleplay** for ${reason}. The type of this infraction is ${type}.`,
        });
        return;
      } catch (err) {
        console.log(err);
      }
    }

    if (subcommand === "list") {
      const role_ids = [
        "1529583874202407125",
        "1529584121662144742",
        "1529592813380173864",
      ];
      const hasRole = interaction.member.roles.cache.has(role_ids);
      const isAdmin = interaction.member.permissions.has("Administrator");

      if (!isAdmin && !hasRole) {
        return interaction.reply({
          content: "You do not have permission.",
          ephemeral: true,
        });
      }
      await interaction.deferReply({
        ephemeral: true,
      });

      const user = interaction.options.getUser("user");

      const infractions = db
        .prepare(
          `
        SELECT *
        FROM infractions
        WHERE user_id = ?
        ORDER BY issued_at DESC
      `,
        )
        .all(user.id);

      if (!infractions.length) {
        return interaction.editReply({
          content: `No infractions found for ${user}.`,
        });
      }

      const list = infractions
        .map(
          (infraction) =>
            `**ID:** \`${infraction.id}\`
**Type:** ${infraction.infraction_type}
**Reason:** ${infraction.reason}
**Issued By:** <@${infraction.issued_by}>`,
        )
        .join("\n\n");

      return interaction.editReply({
        embeds: [
          {
            color: 0x2b2d31,
            title: `${user.username}'s Infractions`,
            description: list,
          },
        ],
      });
    }

    if (subcommand === "void") {
      const role_ids = [
        "1529583874202407125",
        "1529584121662144742",
        "1529592813380173864",
      ];
      const hasRole = interaction.member.roles.cache.has(role_ids);
      const isAdmin = interaction.member.permissions.has("Administrator");

      if (!isAdmin && !hasRole) {
        return interaction.reply({
          content: "You do not have permission.",
          ephemeral: true,
        });
      }

      await interaction.deferReply({
        ephemeral: true,
      });

      const id = interaction.options.getString("id");

      const infraction = db
        .prepare(
          `
          SELECT *
          FROM infractions
          WHERE id = ?
        `,
        )
        .get(id);

      if (!infraction) {
        return interaction.editReply({
          content: `No infraction found with ID ${id}.`,
        });
      }

      const user = interaction.options.getUser("user");

      await user
        .send({
          embeds: [
            {
              color: 0xffff00,
              title: "Infraction Voided",
              description: `Your infraction has been voided.

**ID**
\`${id}\``,
            },
          ],
        })
        .catch(() => {});

      db.prepare(
        `
        DELETE FROM infractions
        WHERE id = ?
      `,
      ).run(id);

      return interaction.editReply({
        content: `Successfully voided infraction ${id}.`,
      });
    }
  },
};
