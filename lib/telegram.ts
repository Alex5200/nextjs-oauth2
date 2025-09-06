import crypto from "crypto";

export type TelegramAuthData = Record<string, string>;

export function validateTelegramData(data: TelegramAuthData, botToken: string): boolean {
  const hash = data.hash;
  if (!hash) return false;
  const authData = { ...data };
  delete authData.hash;

  const dataCheckString = Object.keys(authData)
    .sort()
    .map((key) => `${key}=${authData[key]}`)
    .join("\n");

  // secret = HMAC_SHA256(botToken, "WebAppData")
  const secret = crypto.createHmac("sha256", botToken).update("WebAppData").digest("hex");
  const computedHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  return computedHash === hash;
}


