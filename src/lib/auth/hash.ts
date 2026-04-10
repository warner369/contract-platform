const ITERATIONS = 100000; // Max allowed by Cloudflare Workers
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(
  password: string,
  existingSalt?: string,
): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const salt = existingSalt
    ? hexToBytes(existingSalt)
    : crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as Uint8Array<ArrayBuffer>,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH,
  );

  const hashBytes = new Uint8Array(derivedBits as ArrayBuffer);
  return {
    hash: bytesToHex(hashBytes),
    salt: bytesToHex(salt),
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
): Promise<boolean> {
  const { hash } = await hashPassword(password, storedSalt);

  const hashBytes = hexToBytes(hash);
  const storedBytes = hexToBytes(storedHash);

  if (hashBytes.length !== storedBytes.length) {
    return false;
  }

  // Timing-safe comparison using XOR
  let diff = 0;
  for (let i = 0; i < hashBytes.length; i++) {
    diff |= hashBytes[i] ^ storedBytes[i];
  }
  return diff === 0;
}