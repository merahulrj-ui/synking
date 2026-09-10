/**
 * ==============================================================================
 * PHASE 2: DIFFIE-HELLMAN (ECDH) ZERO-KNOWLEDGE KEY EXCHANGE & ENCRYPTION ENGINE
 * ==============================================================================
 * Algorithm: ECDH P-256 (NIST SP 800-56A)
 * Symmetric Cipher: AES-256-GCM Authenticated Encryption (NIST SP 800-38D)
 * Nonce / IV: 96-bit CSPRNG unique per message
 * Auth Tag: 128-bit GMAC
 * Zero-Knowledge: Server NEVER possesses private keys or shared secrets.
 * ==============================================================================
 */

import { DeviceKeyManager } from './deviceKeyManager';

function getCrypto(): any {
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
    return (globalThis as any).crypto;
  }
  try {
    return require('crypto');
  } catch (e) {
    return null;
  }
}

function bufferToHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export class ECDHKeyExchange {
  private static sessionKeyCache = new Map<string, any>();

  /**
   * Derives a Zero-Knowledge 256-bit AES-GCM session key between my device and peer's device.
   * Both devices compute the EXACT SAME key without ever sending the key over network!
   */
  public static async deriveSharedAESKey(peerPubHex: string): Promise<any> {
    if (this.sessionKeyCache.has(peerPubHex)) {
      return this.sessionKeyCache.get(peerPubHex);
    }

    const cryptoInstance = getCrypto();
    const myPrivKey = await DeviceKeyManager.getNativePrivateKey();
    const peerPubKey = await DeviceKeyManager.importPeerPublicKey(peerPubHex);

    // Compute 256-bit ECDH Shared Secret
    const sharedBits = await cryptoInstance.subtle.deriveBits(
      { name: 'ECDH', public: peerPubKey },
      myPrivKey,
      256
    );

    // Import as AES-256-GCM symmetric key
    const aesKey = await cryptoInstance.subtle.importKey(
      'raw',
      sharedBits,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    this.sessionKeyCache.set(peerPubHex, aesKey);
    return aesKey;
  }

  /**
   * Encrypts plaintext message into Zero-Knowledge AES-256-GCM sealed ciphertext
   */
  public static async encrypt(plainText: string, peerPubHex: string): Promise<string> {
    if (!plainText) return '';

    const cryptoInstance = getCrypto();
    const aesKey = await this.deriveSharedAESKey(peerPubHex);

    // Generate unique 96-bit IV
    const iv = new Uint8Array(12);
    cryptoInstance.getRandomValues(iv);
    const ivHex = bufferToHex(iv);

    const encoder = new TextEncoder();
    const encoded = encoder.encode(plainText);

    const encryptedBuf = await cryptoInstance.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      aesKey,
      encoded
    );

    const fullBytes = new Uint8Array(encryptedBuf);
    const cipherBytes = fullBytes.slice(0, fullBytes.length - 16);
    const tagBytes = fullBytes.slice(fullBytes.length - 16);

    const cipherHex = bufferToHex(cipherBytes);
    const tagHex = bufferToHex(tagBytes);

    // Sealed wire payload
    return `E2EE::V3::ECDH_AES256_GCM::${ivHex}::${tagHex}::${cipherHex}`;
  }

  /**
   * Decrypts Zero-Knowledge AES-256-GCM ciphertext on-device using peer's public key
   */
  public static async decrypt(sealedText: string, peerPubHex: string): Promise<string> {
    if (!sealedText) return '';
    if (!sealedText.startsWith('E2EE::V3::ECDH_AES256_GCM::')) {
      return sealedText; // Legacy fallback
    }

    const parts = sealedText.replace('E2EE::V3::ECDH_AES256_GCM::', '').split('::');
    if (parts.length !== 3) {
      throw new Error('MALFORMED_ECDH_CIPHERTEXT');
    }

    const [ivHex, tagHex, cipherHex] = parts;
    const iv = hexToBuffer(ivHex);
    const tag = hexToBuffer(tagHex);
    const cipherBytes = hexToBuffer(cipherHex);

    const cryptoInstance = getCrypto();
    const aesKey = await this.deriveSharedAESKey(peerPubHex);

    // Recombine ciphertext + 16-byte authentication tag
    const combined = new Uint8Array(cipherBytes.length + tag.length);
    combined.set(cipherBytes, 0);
    combined.set(tag, cipherBytes.length);

    try {
      const decryptedBuf = await cryptoInstance.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        aesKey,
        combined
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuf);
    } catch (err) {
      throw new Error('🚨 ECDH_AUTH_FAILED: Message authentication failed. Possible tampering or invalid peer key.');
    }
  }
}
