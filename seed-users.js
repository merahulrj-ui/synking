// ============================================================
// SYNKING — Seed Script
// 1. Deletes ALL existing dummy users from Turso SQLite DB
// 2. Seeds 3 realistic Indian user profiles
// Run: node seed-users.js
// ============================================================

try { require('dotenv').config(); } catch (e) {}

const https = require('https');
const crypto = require('crypto');

const TURSO_URL = (process.env.TURSO_DATABASE_URL && process.env.TURSO_DATABASE_URL.trim())
  ? process.env.TURSO_DATABASE_URL.trim()
  : 'https://synking-db-pikirahulkumar-eng.aws-ap-south-1.turso.io';

const TURSO_TOKEN = (process.env.TURSO_AUTH_TOKEN && process.env.TURSO_AUTH_TOKEN.trim().length > 20)
  ? process.env.TURSO_AUTH_TOKEN.trim()
  : 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc4OTI0MzYsImlkIjoiMDFhMDQ2YWUtNzgwMS03MzdlLTg3MzAtZWI1NTY5Yjk0NmUxIiwia2lkIjoiMmROU0NaSHpYX2FfcVVsLVhFWmFOSm1tYkRJeUo1VmJsZ3BjSXJnNmc5cyIsInJpZCI6IjRhNWIxNDE3LTkzYWYtNGZiYi1hOTNmLTNiYjU3NGFhOTA3NyJ9.3qHyMOLW_iLlaL0j6c5krGBrR6BrU9nwkzAExC0uH8hYuWXGj1ph79X4YNJuo_Xw3CKaqiUCW0ALaTLGHoeHAw';

// ─── Turso Query Helper ──────────────────────────────────────
function queryTurso(sql, args = []) {
  return new Promise((resolve, reject) => {
    const formattedArgs = args.map(arg => {
      if (arg && typeof arg === 'object' && arg.type !== undefined) return arg;
      if (typeof arg === 'number') return Number.isInteger(arg) ? { type: 'integer', value: arg.toString() } : { type: 'float', value: arg };
      if (typeof arg === 'boolean') return { type: 'integer', value: arg ? '1' : '0' };
      if (arg === null || arg === undefined) return { type: 'null' };
      return { type: 'text', value: typeof arg === 'object' ? JSON.stringify(arg) : String(arg) };
    });

    const payload = JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args: formattedArgs } },
        { type: 'close' }
      ]
    });

    const urlObj = new URL('/v2/pipeline', TURSO_URL);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TURSO_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(null); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── 3 Realistic Indian Seed Users ──────────────────────────
const SEED_USERS = [
  {
    id: 'seed_user_priya_001',
    name: 'Priya Sharma',
    age: 24,
    gender: 'female',
    occupation: 'Software Engineer',
    location: JSON.stringify({ city: 'Mumbai' }),
    bio: 'Tech enthusiast by day, foodie by night 🍕 | Love hiking & Bollywood movies 🎬',
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&q=80',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&q=80',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500&q=80'
    ]),
    interests: JSON.stringify(['Hiking', 'Bollywood', 'Cooking', 'Travel', 'Tech']),
    preferences: JSON.stringify({
      lookingFor: 'Serious Relationship',
      ageRange: [24, 32],
      zodiac: 'Libra',
      height: "5'4\"",
      drinking: 'Socially',
      smoking: 'Never',
      workout: 'Often',
      dietary: 'Vegetarian',
      pets: 'Dog lover 🐶',
      hometown: 'Pune',
      languages: ['Hindi', 'English', 'Marathi'],
      school: 'IIT Bombay',
      prompts: [
        { question: 'My ideal Sunday looks like...', answer: 'Chai + good book + sunset view 🌅' },
        { question: 'I get excited talking about...', answer: 'AI, travel stories and startup ideas!' }
      ]
    }),
    phone_number: '',
    isVerified: 1,
    isVip: 0,
    compatibility: 90,
    completionPercentage: 95,
  },
  {
    id: 'seed_user_arjun_002',
    name: 'Arjun Mehta',
    age: 27,
    gender: 'male',
    occupation: 'Product Manager',
    location: JSON.stringify({ city: 'Bangalore' }),
    bio: 'Building things that matter 🚀 | Weekend runner | Coffee addict ☕ | Let\'s match and make something real.',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80',
      'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=500&q=80'
    ]),
    interests: JSON.stringify(['Running', 'Coffee', 'Startups', 'Cricket', 'Photography']),
    preferences: JSON.stringify({
      lookingFor: 'Long-term',
      ageRange: [22, 30],
      zodiac: 'Scorpio',
      height: "5'11\"",
      drinking: 'Occasionally',
      smoking: 'Never',
      workout: 'Daily',
      dietary: 'Non-Vegetarian',
      pets: 'Cat person 🐱',
      hometown: 'Delhi',
      languages: ['Hindi', 'English'],
      school: 'NIT Trichy',
      prompts: [
        { question: 'The way to my heart is...', answer: 'Good conversation over filter coffee ☕' },
        { question: 'I\'m looking for...', answer: 'Someone who can match my energy and laugh at my bad puns 😄' }
      ]
    }),
    phone_number: '',
    isVerified: 1,
    isVip: 1,
    compatibility: 87,
    completionPercentage: 92,
  },
  {
    id: 'seed_user_neha_003',
    name: 'Neha Kapoor',
    age: 22,
    gender: 'female',
    occupation: 'Content Creator & Designer',
    location: JSON.stringify({ city: 'Delhi' }),
    bio: 'Turning ideas into art 🎨 | Yoga every morning 🧘 | Chai > Coffee | Looking for real connection, not just swipes.',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&q=80',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&q=80',
      'https://images.unsplash.com/photo-1515077678510-ce3bdf418862?w=500&q=80'
    ]),
    interests: JSON.stringify(['Yoga', 'Design', 'Poetry', 'Travel', 'Chai']),
    preferences: JSON.stringify({
      lookingFor: 'Something serious',
      ageRange: [22, 30],
      zodiac: 'Pisces',
      height: "5'5\"",
      drinking: 'Never',
      smoking: 'Never',
      workout: 'Daily (Yoga)',
      dietary: 'Vegetarian',
      pets: 'Love all animals 🐾',
      hometown: 'Jaipur',
      languages: ['Hindi', 'English', 'Rajasthani'],
      school: 'Lady Shri Ram College, Delhi',
      prompts: [
        { question: 'A non-negotiable for me is...', answer: 'Kindness. Always.' },
        { question: 'My love language is...', answer: 'Quality time and handwritten notes 📝' }
      ]
    }),
    phone_number: '',
    isVerified: 1,
    isVip: 0,
    compatibility: 93,
    completionPercentage: 98,
  }
];

// ─── Main Script ─────────────────────────────────────────────
async function run() {
  console.log('\n🔗 Connecting to Turso Cloud SQLite...');
  console.log(`   URL: ${TURSO_URL}\n`);

  // STEP 1: Delete ALL existing users (dummy cleanup)
  console.log('🗑️  STEP 1: Deleting ALL existing dummy users...');
  try {
    const delResult = await queryTurso('DELETE FROM users');
    const changes = delResult?.results?.[0]?.response?.result?.affected_row_count;
    console.log(`   ✅ Deleted ${changes !== undefined ? changes : 'all'} users from DB.\n`);
  } catch (e) {
    console.error('   ❌ Error deleting users:', e.message);
    process.exit(1);
  }

  // Also clean related requests and messages for a fresh start
  console.log('🧹  Cleaning synk_requests & messages tables...');
  await queryTurso('DELETE FROM synk_requests').catch(() => {});
  await queryTurso('DELETE FROM messages').catch(() => {});
  console.log('   ✅ Requests and messages cleared.\n');

  // STEP 2: Insert 3 seed users
  console.log('👤  STEP 2: Inserting 3 realistic Indian seed users...\n');

  const sql = `INSERT OR REPLACE INTO users 
    (id, name, age, bio, photo, photos, location, gender, preferences, safety_contact, phone_number) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  for (const user of SEED_USERS) {
    try {
      await queryTurso(sql, [
        user.id,
        user.name,
        user.age,
        user.bio,
        user.photo,
        user.photos,
        user.location,
        user.gender,
        user.preferences,
        JSON.stringify({}),
        user.phone_number
      ]);
      console.log(`   ✅ Inserted: ${user.name} (${user.age}y, ${user.gender}, ${JSON.parse(user.location).city})`);
    } catch (e) {
      console.error(`   ❌ Failed to insert ${user.name}:`, e.message);
    }
  }

  // STEP 3: Verify
  console.log('\n🔍  STEP 3: Verifying — fetching users from DB...\n');
  try {
    const verifyRes = await queryTurso('SELECT id, name, age, gender FROM users');
    const rows = verifyRes?.results?.[0]?.response?.result?.rows || [];
    const cols = (verifyRes?.results?.[0]?.response?.result?.cols || []).map(c => c.name || c);

    if (rows.length === 0) {
      console.log('   ⚠️  No users found. Check your Turso connection.');
    } else {
      console.log(`   ✅ ${rows.length} user(s) now in database:\n`);
      rows.forEach(r => {
        const id   = r[0]?.value ?? r[0] ?? '-';
        const name = r[1]?.value ?? r[1] ?? '-';
        const age  = r[2]?.value ?? r[2] ?? '-';
        const gen  = r[3]?.value ?? r[3] ?? '-';
        console.log(`      👤 ${name} | Age: ${age} | Gender: ${gen} | ID: ${id}`);
      });
    }
  } catch (e) {
    console.error('   ❌ Verification error:', e.message);
  }

  console.log('\n🎉  Done! Synking DB is clean with 3 real seed users.\n');
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
