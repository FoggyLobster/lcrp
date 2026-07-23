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
  customId: "shift_resume",

  async execute(interaction) {
    const userId = interaction.user.id;

    const shift = db
      .prepare(
        `
        SELECT *
        FROM shifts
        WHERE user_id = ?
        AND status = 'break'
        LIMIT 1
      `,
      )
      .get(userId);

    if (!shift) {
      return interaction.reply({
        content: "You are not currently on break.",
        ephemeral: true,
      });
    }

    db.prepare(
      `
      UPDATE shifts
      SET status = 'online'
      WHERE id = ?
    `,
    ).run(shift.id);

    db.prepare(
      `
      UPDATE shifts_breaks
      SET ended_at = ?
      WHERE user_id = ?
      AND ended_at IS NULL
    `,
    ).run(Date.now(), userId);

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

    const total_time = db
      .prepare(
        `
        SELECT SUM(total_time) AS time
        FROM shifts
        WHERE user_id = ?
      `,
      )
      .get(userId);

    const totalTime = total_time ? total_time.time : 0;

    const embed = new EmbedBuilder()
      .setTitle("Shift Management")
      .setDescription(
        `Hey, <@${userId}>. You are now managing your shift.

**Shift Status:** Online
**Total Shift Time:** ${formatTime(totalTime)}
**Total Shifts:** ${count.count}`,
      );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("shift_start")
        .setLabel("Start Shift")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId("shift_break")
        .setLabel("Take a Break")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(false),

      new ButtonBuilder()
        .setCustomId("shift_end")
        .setLabel("End Shift")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(false),
    );

    interaction.edit({
      embeds: [embed],
      components: [buttons],
    });

    return interaction.reply({
      content: "Shift has resumed.",
      ephemeral: true,
    });
  },
};
