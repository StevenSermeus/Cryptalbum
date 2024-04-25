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
): Promise<string | undefined> {
  try {
    const decrypted = await crypto.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      data,
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.log(e);
  }
}

export function clearKeyPair() {
  localStorage.removeItem("publicKey");
  localStorage.removeItem("privateKey");
}

export async function generateSymmetricalKey(): Promise<CryptoKey> {
  const key = await crypto.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  return key;
}

export async function exportSymmetricalKey(key: CryptoKey): Promise<string> {
  const exportedKey = await crypto.exportKey("jwk", key);
  return JSON.stringify(exportedKey);
}

export async function importSymmetricalKey(
  key: string,
): Promise<CryptoKey | null> {
  const importedKey = await crypto.importKey(
    "jwk",
    JSON.parse(key),
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"],
  );
  return importedKey;
}

export async function encryptFileSymmetrical(
  file: File,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const fileBuffer = await file.arrayBuffer();
  const encrypted = await crypto.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(12) },
    key,
    fileBuffer,
  );
  return encrypted;
}

export async function decryptFileSymmetrical(
  file: ArrayBuffer,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const decrypted = await crypto.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(12) },
    key,
    file,
  );
  return decrypted;
}
