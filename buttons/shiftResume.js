const db = require("../db");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  customId: "shift_resume",

  async execute(interaction) {
    const user = interaction.user;

    const active = db
      .prepare(
        `
      SELECT *
      FROM shifts
      WHERE user_id = ?
      AND status = 'online'
      LIMIT 1
    `,
      )
      .get(user.id);

    if (!active) {
      return interaction.reply({
        content: "You are not on shift.",
        ephemeral: true,
      });
    }

    db.prepare(
      `
      UPDATE shifts
      SET status = 'online'
      WHERE user_id = ?
    `,
    ).run(user.id);

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

    const userId = user.id;

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
