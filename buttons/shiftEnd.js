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
  customId: "shift_end",

  async execute(interaction) {
    const userId = interaction.user.id;

    const shift = db
      .prepare(
        `
        SELECT *
        FROM shifts
        WHERE user_id = ?
        AND status != 'offline'
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

    const now = Date.now();

    let breakTime = 0;

    const breaks = db
      .prepare(
        `
        SELECT *
        FROM shifts_breaks
        WHERE shift_id = ?
        `,
      )
      .all(shift.shift_id);

    for (const shiftBreak of breaks) {
      if (shiftBreak.ended_at) {
        breakTime += shiftBreak.duration;
      } else {
        const duration = now - shiftBreak.started_at;

        breakTime += duration;

        db.prepare(
          `
          UPDATE shifts_breaks
          SET
            ended_at = ?,
            duration = ?
          WHERE id = ?
          `,
        ).run(now, duration, shiftBreak.id);
      }
    }

    const workedTime = now - shift.started_at - breakTime;

    db.prepare(
      `
      UPDATE shifts
      SET
        status = 'offline',
        ended_at = ?,
        total_time = total_time + ?
      WHERE id = ?
      `,
    ).run(now, workedTime > 0 ? workedTime : 0, shift.id);

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
**Shift Completed:** ${formatTime(workedTime)}
**Total Shift Time:** ${formatTime(totalTime)}
**Total Shifts:** ${count.count}`,
      )
      .setColor(0xff0000);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("shift_start")
        .setLabel("Start Shift")
        .setStyle(ButtonStyle.Success)
        .setDisabled(false),

      new ButtonBuilder()
        .setCustomId("shift_break")
        .setLabel("Take a Break")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId("shift_end")
        .setLabel("End Shift")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
    );

    return interaction.update({
      embeds: [embed],
      components: [buttons],
    });
  },
};
