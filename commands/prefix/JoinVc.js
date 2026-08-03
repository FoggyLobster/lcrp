const { joinVoiceChannel } = require("@discordjs/voice");

module.exports = {
  name: "joinvc",

  async execute(client, message, args) {
    const vcId = args[0];

    if (!vcId) {
      return message.reply("Please provide a voice channel ID.");
    }

    const voiceChannel = message.guild.channels.cache.get(vcId);

    if (!voiceChannel || voiceChannel.type !== 2) {
      return message.reply("That is not a valid voice channel.");
    }

    try {
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      await message.reply(`Joined **${voiceChannel.name}**.`);
    } catch (error) {
      console.error("VC Join Error:", error);

      await message.reply("I could not join that voice channel.");
    }
  },
};
