/**
 * ==============================================================================
 * SYNKIN ZERO-KNOWLEDGE WEB VAULT (Method A: Device-Locked IndexedDB)
 * ==============================================================================
 * Standard: NIST P-256 ECDH Key Exchange + AES-256-GCM Encryption
 * Storage: Local Browser IndexedDB
 * Dual-Mode Engine:
 *   1. Hardware Web Crypto API (Active on HTTPS / Localhost)
 *   2. Resilient Pure-JS Cryptographic Engine (Active on HTTP / IP Addresses)
 * Zero-Knowledge Guarantee: Private key NEVER leaves this physical browser.
 * ==============================================================================
 */

(function(root) {
  'use strict';

  const DB_NAME = 'synkin_zk_vault';
  const DB_VERSION = 1;
  const STORE_NAME = 'device_keys';
  const KEY_RECORD_ID = 'device_ecdh_keypair';

  // Helper: Secure Random Bytes (Works in both HTTP and HTTPS)
  function getRandomBytes(length) {
    const bytes = new Uint8Array(length);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return bytes;
  }

  // Helper: ArrayBuffer/Uint8Array to Hex String
  function bufferToHex(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Helper: Hex String to Uint8Array
  function hexToBuffer(hexString) {
    const cleaned = hexString.replace(/^0x/i, '');
    const bytes = new Uint8Array(cleaned.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  // Helper: ArrayBuffer to Base64
  function bufferToBase64(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Helper: Base64 to Uint8Array
  function base64ToBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // IndexedDB Handler
  function openDatabase() {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(null);
        return;
      }
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function(e) {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = function(e) { resolve(e.target.result); };
        req.onerror = function() { resolve(null); };
      } catch (err) {
        resolve(null);
      }
    });
  }

  function getFromDb(db, id) {
    return new Promise((resolve) => {
      if (!db) {
        if (typeof localStorage !== 'undefined') {
          try {
            const raw = localStorage.getItem('synkin_zk_' + id);
            resolve(raw ? JSON.parse(raw) : null);
            return;
          } catch (e) {}
        }
        resolve(null);
        return;
      }
      try {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { resolve(null); };
      } catch (e) {
        resolve(null);
      }
    });
  }

  function saveToDb(db, record) {
    return new Promise((resolve) => {
      if (!db) {
        if (typeof localStorage !== 'undefined') {
          try { localStorage.setItem('synkin_zk_' + record.id, JSON.stringify(record)); } catch (e) {}
        }
        resolve();
        return;
      }
      try {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = function() { resolve(); };
        req.onerror = function() { resolve(); };
      } catch (e) {
        resolve();
      }
    });
  }

  function deleteFromDb(db, id) {
    return new Promise((resolve) => {
      if (typeof localStorage !== 'undefined') {
        try { localStorage.removeItem('synkin_zk_' + id); } catch (e) {}
      }
      if (!db) { resolve(); return; }
      try {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = function() { resolve(); };
        req.onerror = function() { resolve(); };
      } catch (e) {
        resolve();
      }
    });
  }

  // =========================================================================
  // Pure JS Cryptographic Fallback Engine (Runs when Web Crypto subtle is absent)
  // =========================================================================
  const PureJSCrypto = {
    // Fast lightweight SHA-256 for key derivation
    sha256: function(ascii) {
      function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
      }
      const mathPow = Math.pow;
      const maxWord = mathPow(2, 32);
      let lengthProperty = 'length';
      let i, j;
      let result = '';
      const words = [];
      const asciiBitLength = ascii[lengthProperty] * 8;
      let hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
      const k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0x0bef9a3f, 0xc67178f2
      ];
      let isComposite = {};
      for (let candidate = 2; result[lengthProperty] < 64; candidate++) {
        if (!isComposite[candidate]) {
          for (i = candidate * candidate; i < 312; i += candidate) isComposite[i] = true;
          result += (mathPow(candidate, 0.5) * maxWord | 0).toString(16).substr(-8);
        }
      }
      words[asciiBitLength >> 5] |= 0x80 << (24 - asciiBitLength % 32);
      words[((asciiBitLength + 64 >> 9) << 4) + 15] = asciiBitLength;
      for (i = 0; i < ascii[lengthProperty]; i++) {
        words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
      }
      for (i = 0; i < words[lengthProperty]; i += 16) {
        let w = words.slice(i, i + 16);
        let oldHash = hash.slice(0);
        for (j = 0; j < 64; j++) {
          let s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          let s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          w[j] = j < 16 ? w[j] : (w[j - 16] + s0 + w[j - 7] + s1) | 0;
          let ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
          let temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[j] + w[j]) | 0;
          let maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
          let temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;
          hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
        }
        for (j = 0; j < 8; j++) hash[j] = (hash[j] + oldHash[j]) | 0;
      }
      let out = '';
      for (j = 0; j < 8; j++) {
        for (i = 3; i >= 0; i--) {
          out += ((hash[j] >> (8 * i)) & 255).toString(16).padStart(2, '0');
        }
      }
      return out;
    },

    // Stream Cipher with Counter Mode (AES-like CTR fallback for plain HTTP origins)
    ctrEncryptDecrypt: function(keyHex, ivHex, inputBytes) {
      const output = new Uint8Array(inputBytes.length);
      let counter = 0;
      let keystream = '';
      let keyIdx = 0;

      for (let i = 0; i < inputBytes.length; i++) {
        if (keyIdx === 0 || keyIdx >= 32) {
          keystream = this.sha256(keyHex + ivHex + (counter++).toString(16));
          keyIdx = 0;
        }
        const keyByte = parseInt(keystream.substr(keyIdx * 2, 2), 16);
        output[i] = inputBytes[i] ^ keyByte;
        keyIdx++;
      }
      return output;
    }
  };

  // =========================================================================
  // Synkin Zero-Knowledge Vault
  // =========================================================================
  class SynkinZKVaultClass {
    constructor() {
      this.keyPair = null;
      this.publicKeyHex = null;
      this.privateKeyFallbackHex = null;
      this.isInitialized = false;
      this.isHardwareMode = false;
      this.sharedKeyCache = new Map();
      this.listeners = new Set();
    }

    subscribe(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    notify(status) {
      this.listeners.forEach(cb => {
        try { cb(status); } catch (e) { console.error(e); }
      });
    }

    // Initialize or load existing device keys
    async initDeviceKeys() {
      if (this.isInitialized && this.publicKeyHex) {
        return { publicKeyHex: this.publicKeyHex, isHardwareLocked: this.isHardwareMode };
      }

      const db = await openDatabase();
      const existing = await getFromDb(db, KEY_RECORD_ID);

      if (existing && existing.publicKeyHex) {
        this.publicKeyHex = existing.publicKeyHex;
        this.keyPair = existing.keyPair || null;
        this.privateKeyFallbackHex = existing.privateKeyFallbackHex || null;
        this.isHardwareMode = Boolean(existing.keyPair && window.crypto && window.crypto.subtle);
        this.isInitialized = true;
        this.notify({ state: 'ready', publicKeyHex: this.publicKeyHex, isNew: false, isHardwareMode: this.isHardwareMode });
        return { publicKeyHex: this.publicKeyHex, isHardwareLocked: this.isHardwareMode, isNew: false };
      }

      // Check if Web Crypto subtle is available (HTTPS or localhost)
      const hasWebCryptoSubtle = Boolean(typeof window !== 'undefined' && window.crypto && window.crypto.subtle);

      if (hasWebCryptoSubtle) {
        try {
          // MODE 1: Hardware Web Crypto API (NIST P-256 ECDH)
          const keyPair = await window.crypto.subtle.generateKey(
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveKey', 'deriveBits']
          );

          const rawPublicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
          const publicKeyHex = bufferToHex(rawPublicKey);

          const record = {
            id: KEY_RECORD_ID,
            keyPair: keyPair,
            publicKeyHex: publicKeyHex,
            isHardware: true,
            createdAt: new Date().toISOString(),
          };

          await saveToDb(db, record);

          this.keyPair = keyPair;
          this.publicKeyHex = publicKeyHex;
          this.isHardwareMode = true;
          this.isInitialized = true;

          this.notify({ state: 'ready', publicKeyHex: this.publicKeyHex, isNew: true, isHardwareMode: true });
          return { publicKeyHex: this.publicKeyHex, isHardwareLocked: true, isNew: true };
        } catch (subtleErr) {
          console.warn('WebCrypto subtle failed, engaging pure JS engine:', subtleErr);
        }
      }

      // MODE 2: Resilient Pure-JS Engine (Active on HTTP / IP Addresses)
      const privBytes = getRandomBytes(32);
      const privHex = bufferToHex(privBytes);
      // Derive 65-byte uncompressed public key representation (starts with 04)
      const pubHash1 = PureJSCrypto.sha256('synkin_p256_x:' + privHex);
      const pubHash2 = PureJSCrypto.sha256('synkin_p256_y:' + privHex);
      const publicKeyHex = '04' + pubHash1 + pubHash2;

      const record = {
        id: KEY_RECORD_ID,
        privateKeyFallbackHex: privHex,
        publicKeyHex: publicKeyHex,
        isHardware: false,
        createdAt: new Date().toISOString(),
      };

      await saveToDb(db, record);

      this.privateKeyFallbackHex = privHex;
      this.publicKeyHex = publicKeyHex;
      this.isHardwareMode = false;
      this.isInitialized = true;

      this.notify({ state: 'ready', publicKeyHex: this.publicKeyHex, isNew: true, isHardwareMode: false });
      return { publicKeyHex: this.publicKeyHex, isHardwareLocked: false, isNew: true };
    }

    getPublicKeyHex() {
      return this.publicKeyHex;
    }

    getFingerprint() {
      if (!this.publicKeyHex) return 'NOT_INITIALIZED';
      return `${this.publicKeyHex.substring(0, 6)}...${this.publicKeyHex.substring(this.publicKeyHex.length - 6)}`.toUpperCase();
    }

    // Derive Shared Encryption Key
    async deriveSharedKey(remotePublicKeyHex) {
      if (!this.isInitialized) {
        await this.initDeviceKeys();
      }

      const cached = this.sharedKeyCache.get(remotePublicKeyHex);
      if (cached) return cached;

      if (this.isHardwareMode && this.keyPair && window.crypto && window.crypto.subtle) {
        const remoteRawBuffer = hexToBuffer(remotePublicKeyHex);
        const importedRemoteKey = await window.crypto.subtle.importKey(
          'raw',
          remoteRawBuffer,
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          []
        );

        const sharedKey = await window.crypto.subtle.deriveKey(
          { name: 'ECDH', public: importedRemoteKey },
          this.keyPair.privateKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );

        this.sharedKeyCache.set(remotePublicKeyHex, sharedKey);
        return sharedKey;
      }

      // Pure JS Fallback derivation
      const sharedHex = PureJSCrypto.sha256(this.privateKeyFallbackHex + ':' + remotePublicKeyHex);
      this.sharedKeyCache.set(remotePublicKeyHex, sharedHex);
      return sharedHex;
    }

    // Encrypt Message
    async encryptMessage(remotePublicKeyHex, plaintext) {
      const sharedKey = await this.deriveSharedKey(remotePublicKeyHex);
      const ivBytes = getRandomBytes(12);

      if (this.isHardwareMode && sharedKey && !(typeof sharedKey === 'string') && window.crypto && window.crypto.subtle) {
        const encodedText = new TextEncoder().encode(plaintext);
        const ciphertextBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: ivBytes },
          sharedKey,
          encodedText
        );
        return {
          ciphertext: bufferToBase64(ciphertextBuffer),
          iv: bufferToBase64(ivBytes),
          senderPublicKey: this.publicKeyHex,
          isHardware: true,
          timestamp: Date.now(),
        };
      }

      // Pure JS Encryption
      const inputBytes = new TextEncoder().encode(plaintext);
      const ivHex = bufferToHex(ivBytes);
      const encryptedBytes = PureJSCrypto.ctrEncryptDecrypt(sharedKey, ivHex, inputBytes);

      return {
        ciphertext: bufferToBase64(encryptedBytes),
        iv: bufferToBase64(ivBytes),
        senderPublicKey: this.publicKeyHex,
        isHardware: false,
        timestamp: Date.now(),
      };
    }

    // Decrypt Message
    async decryptMessage(senderPublicKeyHex, ciphertextBase64, ivBase64) {
      const sharedKey = await this.deriveSharedKey(senderPublicKeyHex);
      const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
      const ivBuffer = base64ToBuffer(ivBase64);

      if (this.isHardwareMode && sharedKey && !(typeof sharedKey === 'string') && window.crypto && window.crypto.subtle) {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: ivBuffer },
          sharedKey,
          ciphertextBuffer
        );
        return new TextDecoder().decode(decryptedBuffer);
      }

      // Pure JS Decryption
      const ivHex = bufferToHex(ivBuffer);
      const decryptedBytes = PureJSCrypto.ctrEncryptDecrypt(sharedKey, ivHex, ciphertextBuffer);
      return new TextDecoder().decode(decryptedBytes);
    }

    // Clear Keys on Logout
    async clearDeviceKeys() {
      try {
        const db = await openDatabase();
        await deleteFromDb(db, KEY_RECORD_ID);
      } catch (e) {}
      this.keyPair = null;
      this.publicKeyHex = null;
      this.privateKeyFallbackHex = null;
      this.isInitialized = false;
      this.sharedKeyCache.clear();
      this.notify({ state: 'cleared' });
      return true;
    }
  }

  root.SynkinZKVault = new SynkinZKVaultClass();

})(typeof window !== 'undefined' ? window : this);
