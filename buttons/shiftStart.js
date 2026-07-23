const db = require("../db");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

function genShiftId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";

  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
}

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

module.exports = {
  customId: "shift_start",

  async execute(interaction) {
    const userId = interaction.user.id;

    const active = db
      .prepare(
        `
      SELECT *
      FROM shifts
      WHERE user_id = ?
      AND status = ?
      LIMIT 1
    `,
      )
      .get(userId, "online");

    if (active) {
      return interaction.reply({
        content: "You are already on shift.",
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
      INSERT INTO shifts
      (
        shift_id,
        wave_id,
        user_id,
        status,
        started_at,
        total_time,
        total_shifts
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(genShiftId(), waveId, userId, `online`, Date.now(), 0, 1);

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

    const status = db
      .prepare("SELECT status FROM shifts WHERE user_id = ?")
      .get(user.id);

    if (status === "break") {
      Status = "On Break";
    } else if (status === "online") {
      Status = "Online";
    } else {
      Status = "Offline";
    }

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

**Shift Status:** ${Status}
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

    interaction.update({
      embeds: [embed],
      components: [buttons],
    });

    return interaction.reply({
      content: "Shift has started.",
      ephemeral: true,
    });
  },
};
