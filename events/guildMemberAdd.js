const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "guildMemberAdd",

  async execute(client, member) {
    const channel = client.channels.cache.get("1313985498397675582");
    if (!channel) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("members")
        .setLabel(member.guild.memberCount.toString())
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
        .setEmoji({ id: "1530640507577831676" })
    );

    await channel.send({
      content: `Welcome, ${member} to **<:lakeshore:1530640507577831676> Lakeshore County Roleplay!** You are member \`#${member.guild.memberCount}\`.`,
      components: [row],
    });

    try {
      await member.roles.add("1529307210851684503");
    } catch (err) {
      console.error("Failed to add role:", err);
    }
  },
};