const db = require("../db");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

function formatTime(ms) {
  if (!ms || ms <= 0) return "0s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const s = seconds % 60;
  const m = minutes % 60;

  let text = "";

  if (hours) text += `${hours}hr `;
  if (m) text += `${m}m `;
  if (s) text += `${s}s`;

  return text.trim();
}

module.exports = {
  customId: "shift_break",

  async execute(interaction) {
    const userId = interaction.user.id;

    const shift = db
      .prepare(
        `
        SELECT *
        FROM shifts
        WHERE user_id = ?
        AND status = 'online'
        LIMIT 1
      `,
      )
      .get(userId);

    if (!shift) {
      return interaction.reply({
        content: "You are not currently on shift.",
        ephemeral: true,
      });
    }

    const existingBreak = db
      .prepare(
        `
        SELECT *
        FROM shifts_breaks
        WHERE shift_id = ?
        AND ended_at IS NULL
      `,
      )
      .get(shift.shift_id);

    if (existingBreak) {
      return interaction.reply({
        content: "You are already on break.",
        ephemeral: true,
      });
    }

    db.prepare(
      `
      UPDATE shifts
      SET status = 'break'
      WHERE id = ?
    `,
    ).run(shift.id);

    db.prepare(
      `
      INSERT INTO shifts_breaks
      (
        shift_id,
        user_id,
        started_at,
        ended_at,
        duration
      )
      VALUES (?, ?, ?, NULL, 0)
    `,
    ).run(shift.shift_id, userId, Date.now());

    const total = db
      .prepare(
        `
        SELECT SUM(total_time) AS time
        FROM shifts
        WHERE user_id = ?
      `,
      )
      .get(userId);

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

**Shift Status** On Break
**Total Shift Time** ${formatTime(total.time)}
**Total Shifts** ${count.count}`,
      );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("shift_start")
        .setLabel("Start Shift")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId("shift_resume")
        .setLabel("Resume Shift")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("shift_end")
        .setLabel("End Shift")
        .setStyle(ButtonStyle.Danger),
    );

    return interaction.update({
      embeds: [embed],
      components: [buttons],
    });
  },
};
