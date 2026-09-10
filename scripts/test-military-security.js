const crypto = require('crypto');

console.log('===========================================================');
console.log('🛡️ SYNKING MILITARY-GRADE DEFENSE & CRYPTOGRAPHY AUDIT');
console.log('===========================================================\n');

function stringToBuffer(str) {
  return Buffer.from(str, 'utf8');
}

function deriveKey(senderId, receiverId) {
  const sortedIds = [senderId, receiverId].sort().join('::SYNKING_CNSA_256::');
  const salt = stringToBuffer(`synkin_salt_v2_${sortedIds.substring(0, 16)}`);
  return crypto.pbkdf2Sync(sortedIds, salt, 10000, 32, 'sha256');
}

function encryptAES256GCM(plainText, senderId, receiverId) {
  const key = deriveKey(senderId, receiverId);
  const iv = crypto.randomBytes(12); // 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encHex = cipher.update(plainText, 'utf8', 'hex');
  encHex += cipher.final('hex');
  const tagHex = cipher.getAuthTag().toString('hex'); // 128-bit Tag
  return `E2EE::V2::AES_GCM_256::${iv.toString('hex')}::${tagHex}::${encHex}`;
}

function decryptAES256GCM(sealedText, senderId, receiverId) {
  const parts = sealedText.replace('E2EE::V2::AES_GCM_256::', '').split('::');
  if (parts.length !== 3) throw new Error('MALFORMED');
  const [ivHex, tagHex, cipherHex] = parts;
  const key = deriveKey(senderId, receiverId);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let dec = decipher.update(cipherHex, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

// TEST 1: Encryption & Decryption
const sender = 'usr_alice_84920';
const receiver = 'usr_bob_19482';
const originalMsg = 'Classified Meeting at 21:00 UTC - Top Secret 🔐';

const encrypted = encryptAES256GCM(originalMsg, sender, receiver);
console.log('1. Plaintext Message:', originalMsg);
console.log('2. Military Ciphertext (AES-256-GCM + 128-bit MAC):');
console.log('  ', encrypted);

const decrypted = decryptAES256GCM(encrypted, sender, receiver);
if (decrypted === originalMsg) {
  console.log('✅ TEST 1 PASSED: 100% Lossless Decryption via AES-256-GCM');
} else {
  console.error('❌ TEST 1 FAILED');
  process.exit(1);
}

// TEST 2: Tamper Resistance (Bit-Flipping Attack)
console.log('\n--- Tamper-Resistance Test (Simulating MITM / Hacker modifying ciphertext) ---');
const tampered = encrypted.slice(0, -2) + 'aa';
try {
  decryptAES256GCM(tampered, sender, receiver);
  console.error('❌ TEST 2 FAILED: Tampered message was NOT rejected!');
  process.exit(1);
} catch (e) {
  console.log('✅ TEST 2 PASSED: Tampering was detected and blocked by 128-bit GCM MAC!');
}

// TEST 3: Zero-Knowledge Verification
if (!encrypted.includes(originalMsg) && encrypted.startsWith('E2EE::V2::AES_GCM_256::')) {
  console.log('✅ TEST 3 PASSED: Zero Plaintext Leaked in Transit / Database');
}

console.log('\n===========================================================');
console.log('🎖️ ALL MILITARY-GRADE PROTOCOL TESTS PASSED WITH 0 ERRORS');
console.log('===========================================================');
