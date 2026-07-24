const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const db = require("../../db");

function formatTime(ms) {
  if (!ms || ms <= 0) return "0s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const s = seconds % 60;
  const m = minutes % 60;

  let result = "";

  if (hours) result += `${hours}hr `;
  if (m) result += `${m}m `;
  if (s) result += `${s}s`;

  return result.trim();
}

function getStatus(userId) {
  const shift = db
    .prepare(
      `
      SELECT status
      FROM shifts
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
    )
    .get(userId);

  if (!shift) return "Offline";

  if (shift.status === "online") return "Online";

  if (shift.status === "break") return "On Break";

  return "Offline";
}

function getTotalTime(userId) {
  const result = db
    .prepare(
      `
      SELECT SUM(total_time) AS time
      FROM shifts
      WHERE user_id = ?
      `,
    )
    .get(userId);

  return result?.time || 0;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shift")
    .setDescription("Shift management system")

    .addSubcommand((sub) =>
      sub.setName("manage").setDescription("Manage your shift"),
    )

    .addSubcommand((sub) =>
      sub.setName("leaderboard").setDescription("View leaderboard"),
    )

    .addSubcommand((sub) =>
      sub.setName("online").setDescription("View online shifts"),
    )

    .addSubcommand((sub) => sub.setName("reset").setDescription("Reset shifts"))

    .addSubcommand((sub) =>
      sub
        .setName("admin")
        .setDescription("Manage a user's shift")
        .addUserOption((option) =>
          option.setName("user").setDescription("User").setRequired(true),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "manage") {
      await interaction.deferReply();

      const userId = interaction.user.id;

      const status = getStatus(userId);

      const totalTime = getTotalTime(userId);

      const count = db
        .prepare(
          `
SELECT COUNT(*) AS count
FROM shifts
WHERE user_id = ?
`,
        )
        .get(userId);

      const embed = new EmbedBuilder()
        .setTitle("Shift Management")
        .setDescription(
          `Hey, <@${userId}>. You are now managing your shift.

**Shift Status** ${status}
**Total Shift Time** ${formatTime(totalTime)}
**Total Shifts** ${count.count}`,
        );

      const active = status === "Online";

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("shift_start")
          .setLabel("Start Shift")
          .setStyle(ButtonStyle.Success)
          .setDisabled(active || status === "On Break"),

        new ButtonBuilder()
          .setCustomId(status === "On Break" ? "shift_resume" : "shift_break")
          .setLabel(status === "On Break" ? "Resume Shift" : "Take A Break")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(status === "Offline"),

        new ButtonBuilder()
          .setCustomId("shift_end")
          .setLabel("End Shift")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(status === "Offline"),
      );

      return interaction.editReply({
        embeds: [embed],
        components: [buttons],
      });
    }

    if (sub === "online") {
      const shifts = db
        .prepare(
          `
SELECT *
FROM shifts
WHERE status = 'online'
`,
        )
        .all();

      if (!shifts.length)
        return interaction.reply("No users are currently on shift.");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Online Shifts")
            .setDescription(
              shifts
                .map(
                  (shift) =>
                    `<@${shift.user_id}> • #${shift.shift_id} • ${formatTime(Date.now() - shift.started_at)}`,
                )
                .join("\n"),
            ),
        ],
      });
    }

    if (sub === "leaderboard") {
      const users = db
        .prepare(
          `
SELECT user_id,SUM(total_time) time
FROM shifts
GROUP BY user_id
ORDER BY time DESC
LIMIT 10
`,
        )
        .all();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Shift Leaderboard")
            .setDescription(
              users.length
                ? users
                    .map(
                      (u, i) =>
                        `**${i + 1}.** <@${u.user_id}> - ${formatTime(u.time)}`,
                    )
                    .join("\n")
                : "No data.",
            ),
        ],
      });
    }

    if (sub === "reset") {
      if (
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      )
        return interaction.reply({
          content: "No permission.",
          ephemeral: true,
        });

      db.prepare("DELETE FROM shifts").run();
      db.prepare("DELETE FROM shifts_breaks").run();

      return interaction.reply("All shifts have been reset.");
    }

    if (sub === "admin") {
      if (
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      )
        return interaction.reply({
          content: "No permission.",
          ephemeral: true,
        });

      const user = interaction.options.getUser("user");

      const status = getStatus(user.id);

      const shifts = db
        .prepare(
          `
SELECT *
FROM shifts
WHERE user_id = ?
ORDER BY id DESC
`,
        )
        .all(user.id);

      const embed = new EmbedBuilder()
        .setTitle("Shift Administration")
        .setDescription(
          `Managing <@${user.id}>

**Status:** ${status}
**Total Time:** ${formatTime(getTotalTime(user.id))}
**Total Shifts:** ${shifts.length}`,
        )
        .setColor(0xff0000);

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`shift_admin_actions:${user.id}`)
          .setPlaceholder("Select action")

          .addOptions([
            {
              label: "Start Shift",
              value: "start",
            },
            {
              label: "Take Break",
              value: "break",
            },
            {
              label: "End Shift",
              value: "end",
            },
            {
              label: "View Shifts",
              value: "view_shifts",
            },
          ]),
      );

      return interaction.reply({
        embeds: [embed],
        components: [menu],
        ephemeral: true,
      });
    }
  },
};
