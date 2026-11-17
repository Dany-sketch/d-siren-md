	import makeWASocket, {
  DisconnectReason
} from "@whiskeysockets/baileys";

import { createSessionStore } from "../services/sessionStore.js";
import { supabase } from "../database/supabase.js";

const sessions = new Map();

async function updateStatus(userId, status) {
  const { error } = await supabase
    .from("whatsapp_sessions")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Session status update failed");
  }
}

export async function requestPairingCode(userId, phoneNumber) {
  if (sessions.has(userId)) {
    throw new Error("A session is already running");
  }

  const number = String(phoneNumber).replace(/\D/g, "");

  if (!/^[1-9]\d{7,14}$/.test(number)) {
    throw new Error("Enter a valid international phone number");
  }

  const store = await createSessionStore(userId);

  const socket = makeWASocket({
    auth: store.state,
    printQRInTerminal: false,
    browser: ["D SIREN MD", "Chrome", "1.0.0"]
  });

  sessions.set(userId, socket);

  socket.ev.on("creds.update", store.saveCreds);

  socket.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      await updateStatus(userId, "connected");
    }

    if (connection === "close") {
      sessions.delete(userId);

      await updateStatus(userId, "disconnected");

      const code = lastDisconnect?.error?.output?.statusCode;

      if (code === DisconnectReason.loggedOut) {
        console.log("WhatsApp session logged out");
      }
    }
  });

  try {
    await new Promise(resolve => setTimeout(resolve, 3000));

    const pairingCode = await socket.requestPairingCode(number);

    return pairingCode;
  } catch (error) {
    sessions.delete(userId);
    socket.end(error);

    throw new Error("Could not generate pairing code");
  }
}

export function getSession(userId) {
  return sessions.get(userId) || null;
}
