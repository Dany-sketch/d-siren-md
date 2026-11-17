import {
  BufferJSON,
  initAuthCreds,
  proto
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

  const decrypted = decryptSession(data.session_data);
  const saved = JSON.parse(decrypted, BufferJSON.reviver);

  if (!saved.creds || !saved.keys) {
    throw new Error("Invalid saved session");
  }

  return saved;
}

export async function createSessionStore(userId) {
  const saved = await loadData(userId);

  const state = saved || {
    creds: initAuthCreds(),
    keys: {}
  };

  let writeQueue = Promise.resolve();

  async function persist() {
    writeQueue = writeQueue.catch(() => {}).then(async () => {
      const serialized = JSON.stringify(
        state,
        BufferJSON.replacer
      );

      const encrypted = encryptSession(serialized);

      const { error } = await supabase
        .from("whatsapp_sessions")
        .upsert({
          user_id: userId,
          session_data: encrypted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;
    });

    return writeQueue;
  }

  const keys = {
    get: async (type, ids) => {
      const result = {};
      const bucket = state.keys[type] || {};

      for (const id of ids) {
        const value = bucket[id];

        if (value !== undefined && value !== null) {
          result[id] =
            type === "app-state-sync-key"
              ? proto.Message.AppStateSyncKeyData.fromObject(value)
              : value;
        }
      }

      return result;
    },

    set: async (data) => {
      for (const [type, entries] of Object.entries(data)) {
        state.keys[type] ||= {};

        for (const [id, value] of Object.entries(entries)) {
          if (value === null) {
            delete state.keys[type][id];
          } else if (value !== undefined) {
            state.keys[type][id] = value;
          }
        }
      }

      await persist();
    }
  };

  await persist();

  return {
    state: {
      creds: state.creds,
      keys
    },

    saveCreds: persist
  };
}
