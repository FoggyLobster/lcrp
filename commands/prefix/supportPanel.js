module.exports = {
  name: "support-panel",

  async execute(client, message) {
    const isOwner = message.member.id === "1062166609931804702";
    if (!isOwner) {
      return message.reply("You do not have permission to use this command.");
    }

    const channel = message.guild.channels.cache.get("1529957808156577984");

    if (channel) {
      await channel.send({
        flags: 32768,
        components: [
          {
            type: 17,
            components: [
              {
                type: 12,
                items: [
                  {
                    media: {
                      url: "https://cdn.discordapp.com/attachments/1531041937107189891/1533830599704576132/assistance1.png?ex=6a71ea90&is=6a709910&hm=8ca299b72657ef632691142747c700787b7f25b37256d7dd2a2b2c3070528f6c&",
                    },
                  },
                ],
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 10,
                content: "# <:lakeshore:1530640507577831676> Assistance",
              },
              {
                type: 10,
                content:
                  "Need help? You've come to the right place! You can choose from support, rewards claiming, and report system! You can find the reasons for each type below.\n\n<:danger:1533693011345674271> Report Ticket\n - Reporting a staff member\n - Reporting a community meber\n - And more along these lines\n\n<:ticket:1531795102425550982> Support Ticket\n - General Inquiries\n - Minor Reports",
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 1,
                components: [
                  {
                    style: 1,
                    type: 2,
                    label: "Create a ticket",
                    flow: {
                      actions: [],
                    },
                    custom_id: "p_331576417403801644",
                  },
                ],
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 12,
                items: [
                  {
                    media: {
                      url: "https://media.discordapp.net/attachments/1529315074991325215/1530981511183208579/underbanner.png?ex=6a721924&is=6a70c7a4&hm=c20d7105e649a4826a7cb423cee57aae9b6c1a57a1ad7cb806eba5295541d0ad&=&format=webp&quality=lossless&width=640&height=63",
                    },
                  },
                ],
              },
            ],
          },
        ],
      });
    }
  },
};
