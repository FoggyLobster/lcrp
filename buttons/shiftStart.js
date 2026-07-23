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

module.exports = {
  customId: "shift_start",

  async execute(interaction) {
    const userId = interaction.user.id;

    const active = db
      .prepare("SELECT * FROM shifts WHERE user_id = ? AND status = 'online'")
      .get(userId);

    if (active) {
      return interaction.reply({
        content: "You already have an active shift.",
        ephemeral: true,
      });
    }

    const now = Date.now();
    const shiftId = genShiftId();

    db.prepare(
      `
      INSERT INTO shifts (
        user_id,
        id,
        started_at,
        total_time,
        status
      )
      VALUES (?, ?, ?, ?, ?)
      `,
    ).run(userId, shiftId, now, 0, "online");

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
      content: `Your shift has started.`,
      ephemeral: true,
    });
  },
};
