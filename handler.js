const fs = require("fs");
const path = require("path");

// load all commands dynamically from ./commands
const commands = {};
const cmdFiles = fs.readdirSync(path.join(__dirname, "commands"));
for (const file of cmdFiles) {
  if (file.endsWith(".js")) {
    const cmd = require(path.join(__dirname, "commands", file));
    commands[cmd.name] = cmd;
  }
}

// Build a consistent "context" object
function buildContext(conn, msg) {
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith("@g.us");
  const sender = isGroup ? msg.key.participant : from;
  const pushname = msg.pushName || "User";

  return {
    from,
    isGroup,
    sender,
    pushname,
    reply: async (text) => {
      return conn.sendMessage(from, { text }, { quoted: msg });
    },
  };
}

async function handleMessage(conn, msg) {
  const context = buildContext(conn, msg);

  // extract text message (handles conversation, extendedText, etc.)
  const type = Object.keys(msg.message)[0];
  const body =
    type === "conversation"
      ? msg.message.conversation
      : type === "extendedTextMessage"
      ? msg.message.extendedTextMessage.text
      : type === "imageMessage" && msg.message.imageMessage.caption
      ? msg.message.imageMessage.caption
      : "";

  if (!body) return;
  if (!body.startsWith("!")) return; // commands start with '!'

  const args = body.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = commands[commandName];
  if (!command) return;

  await command.execute(conn, msg, args, context);
}

module.exports = { handleMessage };
