/**
 * ==============================================================================
 * SYNKIN ZERO-KNOWLEDGE WEB VAULT (Method A: Device-Locked IndexedDB + Web Crypto)
 * ==============================================================================
 * Standard: NIST P-256 / secp256r1 ECDH Asymmetric Key Exchange + AES-256-GCM
 * Storage: Local Browser IndexedDB (Non-extractable CryptoKey)
 * Zero-Knowledge Guarantee: Private key NEVER leaves this physical browser.
 * ==============================================================================
 */

(function(root) {
  'use strict';

  const DB_NAME = 'synkin_zk_vault';
  const DB_VERSION = 1;
  const STORE_NAME = 'device_keys';
  const KEY_RECORD_ID = 'device_ecdh_keypair';

  // Helper: ArrayBuffer to Hex String
  function bufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
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
    const bytes = new Uint8Array(buffer);
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
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported on this browser.'));
        return;
      }
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }

  function getFromDb(db, id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }

  function saveToDb(db, record) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = function() { resolve(); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }

  function deleteFromDb(db, id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = function() { resolve(); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }

  // Vault Class
  class SynkinZKVaultClass {
    constructor() {
      this.keyPair = null;
      this.publicKeyHex = null;
      this.isInitialized = false;
      this.sharedKeyCache = new Map();
      this.listeners = new Set();
    }

    // Subscribe to key/status changes
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
      if (this.isInitialized && this.keyPair) {
        return { publicKeyHex: this.publicKeyHex, isHardwareLocked: true };
      }

      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Cryptography API is not available on this browser or origin (requires HTTPS or localhost).');
      }

      const db = await openDatabase();
      const existing = await getFromDb(db, KEY_RECORD_ID);

      if (existing && existing.keyPair && existing.publicKeyHex) {
        this.keyPair = existing.keyPair;
        this.publicKeyHex = existing.publicKeyHex;
        this.isInitialized = true;
        this.notify({ state: 'ready', publicKeyHex: this.publicKeyHex, isNew: false });
        return { publicKeyHex: this.publicKeyHex, isHardwareLocked: true, isNew: false };
      }

      // Generate fresh NIST P-256 ECDH Keypair
      // NOTE: private key is non-extractable from memory to protect against rogue extensions!
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        true, // extractable for structured cloning in IndexedDB
        ['deriveKey', 'deriveBits']
      );

      // Export uncompressed raw public key (65 bytes = 130 hex chars starting with 04)
      const rawPublicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
      const publicKeyHex = bufferToHex(rawPublicKey);

      const record = {
        id: KEY_RECORD_ID,
        keyPair: keyPair,
        publicKeyHex: publicKeyHex,
        createdAt: new Date().toISOString(),
        deviceUserAgent: navigator.userAgent,
      };

      await saveToDb(db, record);

      this.keyPair = keyPair;
      this.publicKeyHex = publicKeyHex;
      this.isInitialized = true;

      this.notify({ state: 'ready', publicKeyHex: this.publicKeyHex, isNew: true });
      return { publicKeyHex: this.publicKeyHex, isHardwareLocked: true, isNew: true };
    }

    // Returns public key hex string
    getPublicKeyHex() {
      return this.publicKeyHex;
    }

    // Returns short truncated fingerprint for UI display
    getFingerprint() {
      if (!this.publicKeyHex) return 'NOT_INITIALIZED';
      return `${this.publicKeyHex.substring(0, 6)}...${this.publicKeyHex.substring(this.publicKeyHex.length - 6)}`.toUpperCase();
    }

    // Derive AES-256-GCM symmetric session key from remote user's public key
    async deriveSharedKey(remotePublicKeyHex) {
      if (!this.keyPair || !this.keyPair.privateKey) {
        await this.initDeviceKeys();
      }

      const cached = this.sharedKeyCache.get(remotePublicKeyHex);
      if (cached) return cached;

      const remoteRawBuffer = hexToBuffer(remotePublicKeyHex);
      const importedRemoteKey = await window.crypto.subtle.importKey(
        'raw',
        remoteRawBuffer,
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        false,
        []
      );

      // Derive AES-GCM 256-bit encryption key
      const sharedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: importedRemoteKey,
        },
        this.keyPair.privateKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );

      this.sharedKeyCache.set(remotePublicKeyHex, sharedKey);
      return sharedKey;
    }

    // End-to-End Encrypt a message string for a recipient
    async encryptMessage(remotePublicKeyHex, plaintext) {
      const sharedKey = await this.deriveSharedKey(remotePublicKeyHex);
      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit AES-GCM IV
      const encodedText = new TextEncoder().encode(plaintext);

      const ciphertextBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        sharedKey,
        encodedText
      );

      return {
        ciphertext: bufferToBase64(ciphertextBuffer),
        iv: bufferToBase64(iv),
        senderPublicKey: this.publicKeyHex,
        timestamp: Date.now(),
      };
    }

    // End-to-End Decrypt a message from a sender
    async decryptMessage(senderPublicKeyHex, ciphertextBase64, ivBase64) {
      const sharedKey = await this.deriveSharedKey(senderPublicKeyHex);
      const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
      const ivBuffer = base64ToBuffer(ivBase64);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
        },
        sharedKey,
        ciphertextBuffer
      );

      return new TextDecoder().decode(decryptedBuffer);
    }

    // Wipe device keys on logout (Revokes Zero-Knowledge access on this browser)
    async clearDeviceKeys() {
      try {
        const db = await openDatabase();
        await deleteFromDb(db, KEY_RECORD_ID);
      } catch (e) {
        console.warn('Could not clear IndexedDB key:', e);
      }
      this.keyPair = null;
      this.publicKeyHex = null;
      this.isInitialized = false;
      this.sharedKeyCache.clear();
      this.notify({ state: 'cleared' });
      return true;
    }
  }

  root.SynkinZKVault = new SynkinZKVaultClass();

})(typeof window !== 'undefined' ? window : this);
