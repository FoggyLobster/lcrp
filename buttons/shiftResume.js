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
    const userId = interaction.user.id;

    const shift = db
      .prepare("SELECT * FROM shifts WHERE user_id = ? AND status = 'online'")
      .get(userId);

    if (!shift) {
      return interaction.reply({
        content: "You do not have an active shift.",
        ephemeral: true,
      });
    }

    const activeBreak = db
      .prepare(
        `
        SELECT *
        FROM shifts_breaks
        WHERE user_id = ?
        AND shift_id = ?
        AND ended_at IS NULL
        ORDER BY id DESC
        LIMIT 1
        `,
      )
      .get(userId, shift.id);

    if (!activeBreak) {
      return interaction.reply({
        content: "You are not currently on break.",
        ephemeral: true,
      });
    }

    const now = Date.now();

    const breakTime = now - activeBreak.started_at;

    db.prepare(
      `
      UPDATE shifts_breaks
      SET ended_at = ?,
          duration = ?
      WHERE id = ?
      `,
    ).run(now, breakTime, activeBreak.id);

    const user = await interaction.user.fetch();

    const embed = new EmbedBuilder()
      .setTitle("Shift Management")
      .setDescription(
        `Hey, <@${user.id}>. You are now managing your Shift
    
    **Shift Status**
    ${active ? "Online" : "Offline"}
    
    **Total Shift Time For This Wave (Wave #${waveId})**
    ${formatTime(total.time)}
    
    **Total Shifts**
    ${count.count}`,
      );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("shift_start")
        .setLabel("Start Shift")
        .setStyle(ButtonStyle.Success)
        .setDisabled(True),

      new ButtonBuilder()
        .setCustomId("shift_break")
        .setLabel("Take a Break")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("shift_end")
        .setLabel("End Shift")
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.edit({
      embeds: [embed],
    });

    await interaction.reply({
      content: `Your break has ended. You are back on shift.`,
      ephemeral: true,
    });
  },
};
