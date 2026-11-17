import {
  BufferJSON,
  initAuthCreds
} from "@whiskeysockets/baileys";

import { supabase } from "../database/supabase.js";
import {
  encryptSession,
  decryptSession
} from "./encryption.js";

async function loadData(userId) {
  const { data, error } = await supabase
    .from("whatsapp_sessions")
    .select("session_data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data?.session_data) return null;

  const saved = decryptSession(data.session_data);

  return JSON.parse(saved, BufferJSON.reviver);
}

async function saveData(userId, state) {
  const serialized = JSON.stringify(state, BufferJSON.replacer);
  const encrypted = encryptSession(serialized);

  const { error } = await supabase
    .from("whatsapp_sessions")
    .upsert({
      user_id: userId,
      session_data: encrypted,
      status: "disconnected",
      updated_at: new Date().toISOString()
    }, {
      onConflict: "user_id"
    });

  if (error) throw error;
}

export async function createSessionStore(userId) {
  const saved = await loadData(userId);

  const state = saved || {
    creds: initAuthCreds(),
    keys: {}
  };

  const keys = {
    get: async (type, ids) => {
      const result = {};

      for (const id of ids) {
        result[id] = state.keys[type]?.[id];
      }

      return result;
    },

    set: async (data) => {
      for (const [type, entries] of Object.entries(data)) {
        state.keys[type] ||= {};

        for (const [id, value] of Object.entries(entries)) {
          if (value === null) {
            delete state.keys[type][id];
          } else {
            state.keys[type][id] = value;
          }
        }
      }

      await saveData(userId, state);
    }
  };

  return {
    state: {
      creds: state.creds,
      keys
    },

    saveCreds: async () => {
      await saveData(userId, state);
    }
  };
}
