
const fs = require("fs");

const u1 = "user_mtdg7gy1";
const u2 = "user_6466465653";

// 1. Clear Local database.json
try {
  let db = JSON.parse(fs.readFileSync("database.json", "utf-8"));
  let initialCount = db.chats ? db.chats.length : 0;
  db.chats = (db.chats || []).filter(c => {
    return !((c.senderId === u1 && c.receiverId === u2) || (c.senderId === u2 && c.receiverId === u1));
  });
  let deletedCount = initialCount - db.chats.length;
  fs.writeFileSync("database.json", JSON.stringify(db, null, 2));
  console.log(`[LOCAL DB] Deleted ${deletedCount} messages from database.json`);
} catch(e) {
  console.log("No database.json found or error: ", e.message);
}

// 2. Clear Turso Database
const TURSO_URL = "https://synking-db-pikirahulkumar-eng.aws-ap-south-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc4OTI0MzYsImlkIjoiMDFhMDQ2YWUtNzgwMS03MzdlLTg3MzAtZWI1NTY5Yjk0NmUxIiwia2lkIjoiMmROU0NaSHpYX2FfcVVsLVhFWmFOSm1tYkRJeUo1VmJsZ3BjSXJnNmc5cyIsInJpZCI6IjRhNWIxNDE3LTkzYWYtNGZiYi1hOTNmLTNiYjU3NGFhOTA3NyJ9.3qHyMOLW_iLlaL0j6c5krGBrR6BrU9nwkzAExC0uH8hYuWXGj1ph79X4YNJuo_Xw3CKaqiUCW0ALaTLGHoeHAw";

async function clearTurso() {
  try {
    const res = await fetch(`${TURSO_URL}/v2/pipeline`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${TURSO_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: "DELETE FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)", args: [{type:"text", value:u1}, {type:"text", value:u2}, {type:"text", value:u2}, {type:"text", value:u1}] } }
        ]
      })
    });
    const data = await res.json();
    console.log("[TURSO DB] Delete query executed.", JSON.stringify(data));
  } catch(e) {
    console.log("[TURSO DB] Error: ", e.message);
  }
}

clearTurso();

