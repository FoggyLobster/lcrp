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
      .prepare("SELECT * FROM shifts WHERE user_id = ? AND status = 'online'")
      .get(userId);

    if (!shift) {
      return interaction.reply({
        content: "You do not have an active shift.",
        ephemeral: true,
      });
    }

    const ended = Date.now();

    const totalTime = ended - shift.started_at;

    db.prepare(
      `
      UPDATE shifts
      SET 
        status = 'ended',
        total_time = ?
      WHERE id = ?
      `,
    ).run(totalTime, shift.id);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

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
        .setDisabled(False),

      new ButtonBuilder()
        .setCustomId("shift_break")
        .setLabel("Take a Break")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(True),

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
      content: "Your shift has ended.",
      ephemeral: true,
    });

    try {
      await interaction.user.send({
        embeds: [
          {
            title: "Shift Completed",
            description:
              `Your shift has ended.\n\n` +
              `**Shift ID:** ${shift.shift_id}\n` +
              `**Time Worked:** ${formatTime(totalTime)}\n` +
              `**Started:** <t:${Math.floor(shift.started_at / 1000)}:F>\n` +
              `**Ended:** <t:${Math.floor(ended / 1000)}:F>`,
            color: 0xff0000,
          },
        ],
      });
    } catch {
      console.log(`Could not DM ${interaction.user.tag}`);
    }
  },
};
