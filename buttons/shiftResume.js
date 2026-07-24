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

  let result = "";

  if (hours > 0) result += `${hours}hr `;
  if (m > 0) result += `${m}m `;
  if (s > 0) result += `${s}s`;

  return result.trim();
}

function getShiftStatus(userId) {
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
        ORDER BY id DESC
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

    const activeBreak = db
      .prepare(
        `
        SELECT *
        FROM shifts_breaks
        WHERE shift_id = ?
        AND ended_at IS NULL
        `,
      )
      .get(shift.shift_id);

    if (activeBreak) {
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
      VALUES (?, ?, ?, ?, ?)
      `,
    ).run(shift.shift_id, userId, Date.now(), null, 0);

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

    const totalTime = total.time || 0;

    const embed = new EmbedBuilder()
      .setTitle("Shift Management")
      .setDescription(
        `Hey, <@${userId}>. You are now managing your shift.

**Shift Status:** ${getShiftStatus(userId)}
**Total Shift Time:** ${formatTime(totalTime)}
**Total Shifts:** ${count.count}`,
      )
      .setColor(0xffff00);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("shift_start")
        .setLabel("Start Shift")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId("shift_resume")
        .setLabel("Resume Shift")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(false),

      new ButtonBuilder()
        .setCustomId("shift_end")
        .setLabel("End Shift")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(false),
    );

    return interaction.update({
      embeds: [embed],
      components: [buttons],
    });
  },
};
