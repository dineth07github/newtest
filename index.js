const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { handleMessage } = require("./handler");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,  // show QR on first run
  });

  sock.ev.on("creds.update", saveCreds);

  // core listener
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return; // ignore empty
    if (msg.key.fromMe) return; // ignore self

    try {
      await handleMessage(sock, msg);
    } catch (err) {
      console.error("Handler error:", err);
    }
  });
}

// Run it
startBot();
