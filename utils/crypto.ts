
/**
 * Simple encryption wrapper using Web Crypto API (AES-GCM).
 * In a real app, the master key would be derived from a PBKDF2 hash of a user's master password.
 */

const KEY_ALGO = 'AES-GCM';
const PBKDF2_ALGO = 'PBKDF2';

// Simulated derivation for demo. 
// In production, we'd prompt for a master password.
const MASTER_SECRET = "wtg-secure-vault-2024";

async function getEncryptionKey() {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(MASTER_SECRET),
    PBKDF2_ALGO,
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: PBKDF2_ALGO,
      salt: enc.encode('wtg-salt-123'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: KEY_ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(text: string): Promise<{ data: string; iv: string }> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: KEY_ALGO, iv },
    key,
    encoded
  );

  return {
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decrypt(encryptedBase64: string, ivBase64: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
    const encrypted = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));

    const decrypted = await crypto.subtle.decrypt(
      { name: KEY_ALGO, iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed", e);
    return "********";
  }
}

export function generatePassword(length: number = 16): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let retVal = "";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; ++i) {
    retVal += charset[randomValues[i] % charset.length];
  }
  return retVal;
}
