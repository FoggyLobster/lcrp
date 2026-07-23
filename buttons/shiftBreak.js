const db = require("../db");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  customId: "shift_break",

  async execute(interaction) {
    const userId = interaction.user.id;

    const shift = db
      .prepare("SELECT * FROM shifts WHERE user_id = ? AND status = 'online'")
      .get(userId);

    if (!shift) {
      return interaction.reply({
        content: "You are not currently on shift.",
        ephemeral: true,
      });
    }

    const now = Date.now();

    db.prepare(
      `
      INSERT INTO shifts_breaks (
        user_id,
        shift_id,
        started_at
      )
      VALUES (?, ?, ?)
      `,
    ).run(userId, shift.id, now);

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
        .setCustomId("shift_resume")
        .setLabel("Resume Shift")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("shift_end")
        .setLabel("End Shift")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(True),
    );

    await interaction.edit({
      embeds: [embed],
    });

    await interaction.reply({
      content: "Your break has started.",
      ephemeral: true,
    });
  },
};
