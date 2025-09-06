import { jwtEncrypt, jwtDecrypt } from "jose";

type UserPayload = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  provider?: string | null;
};

function getKey(secret: string) {
  // Превращаем секрет в 32-байтный ключ для A256GCM
  const enc = new TextEncoder();
  const raw = enc.encode(secret);
  const key = raw.length >= 32 ? raw.slice(0, 32) : new Uint8Array(32).map((_, i) => raw[i % raw.length]);
  return key;
}

export async function encryptUserCookie(payload: UserPayload, secret: string): Promise<string> {
  const key = getKey(secret);
  const token = await jwtEncrypt(payload, key, { alg: "dir", enc: "A256GCM" });
  return token;
}

export async function decryptUserCookie(token: string, secret: string): Promise<UserPayload> {
  const key = getKey(secret);
  const { payload } = await jwtDecrypt(token, key);
  return payload as unknown as UserPayload;
}


