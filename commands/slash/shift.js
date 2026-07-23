const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
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

  if (hours > 0) result += `${hours}hr `;
  if (m > 0) result += `${m}m `;
  if (s > 0) result += `${s}s`;

  return result.trim();
}

function genShiftId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";

  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shift")
    .setDescription("Shift management system")

    .addSubcommand((sub) =>
      sub.setName("manage").setDescription("Start or end your shift"),
    )

    .addSubcommand((sub) =>
      sub.setName("leaderboard").setDescription("View shift leaderboard"),
    )

    .addSubcommand((sub) =>
      sub.setName("online").setDescription("View users on shift"),
    )

    .addSubcommand((sub) =>
      sub.setName("reset").setDescription("Reset all shifts"),
    )

    .addSubcommand((sub) =>
      sub
        .setName("admin")
        .setDescription("Manage a user's shifts")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to manage")
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "manage") {
      await interaction.deferReply();
      const {
        ActionRowBuilder,
        ButtonBuilder,
        ButtonStyle,
      } = require("discord.js");

      const user = interaction.user;

      const active = db
        .prepare(
          `
        SELECT *
        FROM shifts
        WHERE user_id = ?
        AND status = 'online'
    `,
        )
        .get(user.id);

      const total = db
        .prepare(
          `
        SELECT SUM(total_time) AS time
        FROM shifts
        WHERE user_id = ?
    `,
        )
        .get(user.id);

      const count = db
        .prepare(
          `
        SELECT COUNT(*) AS count
        FROM shifts
        WHERE user_id = ?
    `,
        )
        .get(user.id);

      const wave = db
        .prepare(
          `
        SELECT *
        FROM shift_wave
        WHERE status = 'active'
        ORDER BY id DESC
        LIMIT 1
    `,
        )
        .get();

      const waveId = wave ? wave.wave_id : "None";

      const status = db
        .prepare("SELECT status FROM shifts WHERE user_id = ?")
        .get(user.id);

      const embed = new EmbedBuilder()
        .setTitle("Shift Management")
        .setDescription(
          `Hey, <@${user.id}>. You are now managing your Shift

**Shift Status** ${status}
**Total Time** ${formatTime(total.time)}
**Total Shifts** ${count.count}`,
        );

      const userId = interaction.user.id;
      const isOnline = db
        .prepare("SELECT * FROM shifts WHERE user_id = ? AND status = 'online'")
        .get(userId);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("shift_start")
          .setLabel("Start Shift")
          .setStyle(ButtonStyle.Success)
          .setDisabled(!!isOnline),

        new ButtonBuilder()
          .setCustomId("shift_break")
          .setLabel("Take a Break")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!isOnline),

        new ButtonBuilder()
          .setCustomId("shift_end")
          .setLabel("End Shift")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!isOnline),
      );

      return interaction.editReply({
        embeds: [embed],
        components: [buttons],
      });
    }

    if (sub === "online") {
      const shifts = db
        .prepare("SELECT * FROM shifts WHERE status = 'online'")
        .all();

      if (!shifts.length) {
        return interaction.reply("No users are currently on shift.");
      }

      const list = shifts
        .map(
          (shift) =>
            `<@${shift.user_id}> - #${shift.shift_id} - ${formatTime(Date.now() - shift.started_at)}`,
        )
        .join("\n");

      return interaction.reply({
        embeds: [
          new EmbedBuilder().setTitle("Online Shifts").setDescription(list),
        ],
      });
    }

    if (sub === "leaderboard") {
      const users = db
        .prepare(
          `
                SELECT user_id, SUM(total_time) AS time
                FROM shifts
                GROUP BY user_id
                ORDER BY time DESC
                LIMIT 10
            `,
        )
        .all();

      const list = users
        .map(
          (user, index) =>
            `**${index + 1}.** <@${user.user_id}> - ${formatTime(user.time)}`,
        )
        .join("\n");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Shift Leaderboard")
            .setDescription(list || "No shift data found."),
        ],
      });
    }

    if (sub === "reset") {
      if (
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        return interaction.reply({
          content: "You do not have permission.",
          ephemeral: true,
        });
      }

      db.prepare("DELETE FROM shifts").run();
      db.prepare("DELETE FROM shifts_breaks").run();
      db.prepare("DELETE FROM shift_wave").run();

      return interaction.reply("All shifts have been reset.");
    }

    if (sub === "admin") {
      if (
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        return interaction.reply({
          content: "You do not have permission.",
          ephemeral: true,
        });
      }

      const user = interaction.options.getUser("user");

      const active = db
        .prepare(
          `
        SELECT *
        FROM shifts
        WHERE user_id = ?
        AND status = 'online'
        ORDER BY id DESC
        LIMIT 1
    `,
        )
        .get(user.id);

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

      const totalTime = shifts.reduce(
        (total, shift) => total + shift.total_time,
        0,
      );

      const wave = db
        .prepare(
          `
        SELECT *
        FROM shift_wave
        WHERE status = 'active'
        ORDER BY id DESC
        LIMIT 1
    `,
        )
        .get();

      const waveId = wave ? wave.wave_id : "None";

      const embed = new EmbedBuilder()
        .setTitle("Shift Administration")
        .setDescription(
          `Managing <@${user.id}>'s shift

**Shift Status:** ${active ? "Online" : "Offline"}
**Total Shift Time:** ${formatTime(totalTime)}
**Total Shifts:** ${shifts.length}`,
        )
        .setColor(0xff0000)
        .setFooter({ text: `${user.username}` });

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`shift_admin_actions:${user.id}`)
          .setPlaceholder("Select an action")
          .addOptions([
            {
              label: "Start Shift",
              value: "start",
              description: "Start this user's shift",
            },
            {
              label: "Take Break",
              value: "break",
              description: "Put user on break",
            },
            {
              label: "End Shift",
              value: "end",
              description: "End this user's shift",
            },
            {
              label: "View Shifts",
              value: "view_shifts",
              description: "View shift history",
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
