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
  customId: "shift_end",

  async execute(interaction) {
    const userId = interaction.user.id;

    const isOnline = db
      .prepare("SELECT * FROM shifts WHERE user_id = ? AND status = 'online'")
      .get(userId);

    if (!isOnline) {
      return interaction.reply({
        content: "You are not on shift.",
        ephemeral: true,
      });
    }

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

    db.prepare(
      `
      UPDATE shifts
      SET status = 'offline',
          ended_at = ?
      WHERE user_id = ?
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
        .setDisabled(false),

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

    return interaction.update({
      embeds: [embed],
      components: [buttons],
    });
  },
};
