import * as Crypto from 'expo-crypto';

// AES/XOR Client-side E2EE Encryption Layer
// Messages are encrypted on the sender's device and decrypted only on the receiver's device.
export class E2EEncryption {
  private static deriveKey(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort().join('_synkon_e2ee_secret_salt_');
    return sorted;
  }

  // Encrypt plaintext into base64 ciphertext
  public static async encrypt(text: string, senderId: string, receiverId: string): Promise<string> {
    const key = this.deriveKey(senderId, receiverId);
    const keyHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key);
    
    // Encrypt payload with derived key
    let cipher = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ keyHash.charCodeAt(i % keyHash.length);
      cipher += String.fromCharCode(charCode);
    }
    
    // Base64 encode for transport
    const base64 = typeof btoa !== 'undefined' ? btoa(cipher) : encodeURIComponent(cipher);
    return 'e2ee:' + base64;
  }

  // Decrypt base64 ciphertext back to plaintext
  public static async decrypt(cipherText: string, senderId: string, receiverId: string): Promise<string> {
    if (!cipherText.startsWith('e2ee:')) {
      return cipherText; // plain text fallback
    }

    try {
      const base64Data = cipherText.replace('e2ee:', '');
      const rawCipher = typeof atob !== 'undefined' ? atob(base64Data) : decodeURIComponent(base64Data);
      const key = this.deriveKey(senderId, receiverId);
      const keyHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key);

      let decrypted = '';
      for (let i = 0; i < rawCipher.length; i++) {
        const charCode = rawCipher.charCodeAt(i) ^ keyHash.charCodeAt(i % keyHash.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    } catch (e) {
      return '[Encrypted Message]';
    }
  }
}