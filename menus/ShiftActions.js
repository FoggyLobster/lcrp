const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
} = require("discord.js");

const db = require("../db");

module.exports = {
  customId: `shift_admin_actions:${userId}`,

  async execute(interaction) {
    const [, userId] = interaction.customId.split(":");
    const user = interaction.guild.members.fetch(userId).catch(() => null);

    const selected = interaction.values[0];

    if (!user) {
      return interaction.reply({
        content: "User not found.",
        ephemeral: true,
      });
    }

    if (selected === "start") {
      const active = db
        .prepare("SELECT * FROM shifts WHERE user_id = ? AND status = 'online'")
        .get(user.id);

      if (active) {
        return interaction.reply({
          content: "User is already on shift.",
          ephemeral: true,
        });
      }

      db.prepare(
        `
        INSERT INTO shifts (user_id, status, started_at, total_time, total_shifts)
        VALUES (?, ?, ?, 0, 1)
    `,
      ).run(user.id, "online", Date.now());

      return interaction.reply({
        content: `<@${user.id}'s shift has been started successfully.`,
        ephemeral: true,
      });
    }

    if (selected === "break") {
      const active = db
        .prepare("SELECT * FROM shifts WHERE user_id = ? AND status = 'online'")
        .get(user.id);

      if (!active) {
        return interaction.reply({
          content: "User is not on shift.",
          ephemeral: true,
        });
      }

      db.prepare(
        `
        INSERT INTO shifts_breaks (user_id, started_at, ended_at)
        VALUES (?, ?, ?, ?)
    `,
      ).run(user.id, Date.now(), Date.now());

      return interaction.reply({
        content: `<@${user.id}'s break has been started successfully.`,
        ephemeral: true,
      });

      const embed = new EmbedBuilder()
        .setTitle("Shift Administration")
        .setDiscription(
          `Managing <@${user.id}>'s shift

**Shift Status:** ${activity}

**Total Shift Time For This Wave (Wave #${waveId}):** ${formatTime(data.total_time)}

**Total Shifts:** ${data.total_shifts}

**Actions:**
`,
        )
        .setColor(0xff0000);

      const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`shift_admin_actions:${user.id}`)
          .setPlaceholder("Select an action")
          .addOptions([
            {
              label: "Start Shift",
              value: "start",
              description: "Starts the shift",
            },
            {
              label: "Take a Break",
              value: "break",
              description: ` `,
            },
            {
              label: "End Shift",
              value: "end",
              description: "Ends the shift",
            },
            {
              label: "View Shifts",
              value: "view_shifts",
              description: `View all shifts for this wave (${waveId})`,
            },
          ]),
      );

      await interaction.edit({
        embeds: [embed],
        components: [menu],
      });
    }

    if (selected === "end") {
      const active = db
        .prepare("SELECT * FROM shifts WHERE user_id = ? AND status = 'online'")
        .get(user.id);

      if (!active) {
        return interaction.reply({
          content: "User is not on shift.",
          ephemeral: true,
        });
      }

      db.prepare(
        `
        UPDATE shifts
        SET status = "offline", ended_at = ?
        WHERE user_id = ?
    `,
      ).run(Date.now(), user.id);

      return interaction.reply({
        content: `<@${user.id}'s shift has been ended successfully.`,
        ephemeral: true,
      });
    }

    if (selected === "view_shifts") {
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

      const list = shifts
        .map(
          (shift) =>
            `<@${shift.user_id}> - #${shift.shift_id} - ${formatTime(shifts.started_at - shifts.ended_at)}`,
        )
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle("Shifts List")
        .setDescription(list || "No shift data found.");

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  },
};
