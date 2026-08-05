const fs = require("fs");
const path = require("path");

function generateTranscript(ticket) {
  const transcriptsPath = path.join(__dirname, "transcripts");

  if (!fs.existsSync(transcriptsPath)) {
    fs.mkdirSync(transcriptsPath, { recursive: true });
  }

  const transcriptPath = path.join(transcriptsPath, `${ticket.id}.txt`);

  let transcript = "";

  transcript += `Ticket Transcript\n\n`;
  transcript += `Ticket Owner ID: ${ticket.user_id}\n`;
  transcript += `Ticket ID: ${ticket.id}\n`;
  transcript += `Ticket Type: ${ticket.ticket_type}\n`;
  transcript += `Ticket Reason: ${ticket.reason}\n`;
  transcript += `Created at: ${ticket.created_at}\n\n`;

  transcript += `Messages:`;
  transcript += `-------------\n\n`;

  if (ticket.messages && ticket.messages.length > 0) {
    for (const message of ticket.messages) {
      transcript += `[${message.timestamp}] || ${message.author.username}: ${message.author.id}\n`;
      transcript += `${message.content}\n\n`;
    }
  } else {
    transcript += "No messages found.";
  }

  fs.writeFileSync(transcriptPath, transcript);

  return transcriptPath;
}

module.exports = generateTranscript;
