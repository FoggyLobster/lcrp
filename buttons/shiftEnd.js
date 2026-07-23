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
        content: "You are not on shift.",
        ephemeral: true,
      });
    }

    const sessionTime = Date.now() - shift.started_at;

    db.prepare(
      `
      UPDATE shifts
      SET
        status = 'offline',
        ended_at = ?,
        total_time = total_time + ?
      WHERE id = ?
      `,
    ).run(Date.now(), sessionTime, shift.id);

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

    interaction.update({
      embeds: [embed],
      components: [buttons],
    });

    return interaction.reply({
      content: "Shift has ended.",
      ephemeral: true,
    });
  },
};
