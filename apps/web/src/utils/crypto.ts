import * as crypto_backend from "crypto";

const crypto =
  typeof window === "undefined" ? crypto_backend.subtle : window.crypto.subtle;

export async function generateAsymmetricalKeyPair(): Promise<CryptoKeyPair> {
  const algorithm: RsaHashedKeyGenParams = {
    name: "RSA-OAEP",
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  };
  const keyPair = await crypto.generateKey(algorithm, true, [
    "encrypt",
    "decrypt",
  ]);
  storeKeyPair(keyPair);
  return keyPair;
}

export async function storeKeyPair(
  keyPair: CryptoKeyPair,
): Promise<CryptoKeyPair> {
  const publicKey = await crypto.exportKey("jwk", keyPair.publicKey);
  const privateKey = await crypto.exportKey("jwk", keyPair.privateKey);

  localStorage.setItem("publicKey", JSON.stringify(publicKey));
  localStorage.setItem("privateKey", JSON.stringify(privateKey));

  return keyPair;
}

export async function loadKeyPair(): Promise<CryptoKeyPair | null> {
  const publicKeyString = localStorage.getItem("publicKey");
  const privateKeyString = localStorage.getItem("privateKey");

  if (!publicKeyString || !privateKeyString) {
    return null;
  }

  const publicKey = await crypto.importKey(
    "jwk",
    JSON.parse(publicKeyString),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );
  const privateKey = await crypto.importKey(
    "jwk",
    JSON.parse(privateKeyString),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"],
  );
  return { publicKey, privateKey };
}

export async function exportAsymmetricalKey(key: CryptoKey): Promise<string> {
  const exportedKey = await crypto.exportKey("jwk", key);
  return JSON.stringify(exportedKey);
}

export async function importRsaPublicKey(
  publicKey: string,
): Promise<CryptoKey> {
  const importedKey = await crypto.importKey(
    "jwk",
    JSON.parse(publicKey),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );
  return importedKey;
}

export async function encrypt(
  publicKey: CryptoKey,
  data: string,
): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encoded,
  );
  return Buffer.from(encrypted).toString("hex");
}

export async function decrypt(
  privateKey: CryptoKey,
  data: ArrayBuffer,
): Promise<string> {
  const decrypted = await crypto.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    data,
  );
  return new TextDecoder().decode(decrypted);
}

export function clearKeyPair() {
  localStorage.removeItem("publicKey");
  localStorage.removeItem("privateKey");
}
