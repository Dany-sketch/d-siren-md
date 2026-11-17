import crypto from "node:crypto";

const key = Buffer.from(
  process.env.SESSION_ENCRYPTION_KEY || "",
  "base64"
);

if (key.length !== 32) {
  throw new Error("Invalid session encryption key");
}

export function encryptSession(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64")
  ].join(".");
}

export function decryptSession(value) {
  const [iv, tag, encrypted] = value.split(".");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}
