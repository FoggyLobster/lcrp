module.exports = {
  name: "mod",
  description: "Ask the moderator bot something.",

  async execute(client, message) {
    const responses = [
      "How can I help?",
      "How bout no. Handle it urself.",
      "Be nonchalant yeah?",
      "I'm on my lunch break.",
      "Ask again when I care.",
      "Permission denied. Reason: because I said so.",
      "Sure... after my 17th coffee.",
      "You got this. Probably.",
      "Have you tried turning the mod team off and back on?",
      "Sounds like a future you problem.",
      "Negative.",
      "Absolutely not.",
      "Maybe. Maybe not.",
      "I'm just here for the paycheck.",
      "404: Motivation not found.",
      "Do I look like I know the answer?",
      "Let me think... nah.",
      "That's above my pay grade.",
      "Go ask another moderator.",
      "Give me 3-5 business days.",
      "The council will decide your fate.",
      "I'm legally required to say 'maybe.'",
      "You didn't hear this from me... but good luck.",
      "Processing request... ❌ Failed successfully.",
      "I plead the fifth.",
      "¯\\_(ツ)_/¯",
      "Not my circus, not my monkeys.",
      "Fine... what's the issue?",
      "Only if you say please.",
      "I woke up 3 seconds ago.",
    ];

    const reply = responses[Math.floor(Math.random() * responses.length)];

    return message.reply(reply);
  },
};
