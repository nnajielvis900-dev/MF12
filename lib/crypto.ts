import * as Crypto from 'expo-crypto';

/** Cryptographically random hex string (used for salts & session tokens). */
export function randomHex(byteLength = 16): string {
  const bytes = Crypto.getRandomBytes(byteLength);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

/**
 * Salted password digest. In the production Express/PostgreSQL backend
 * (see /server) this is bcrypt with cost 12 — the mobile preview uses a
 * salted SHA-256 digest so no plaintext password is ever persisted.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256(`${salt}::${password}`);
}
