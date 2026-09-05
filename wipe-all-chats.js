
const TURSO_URL = "https://synking-db-pikirahulkumar-eng.aws-ap-south-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc4OTI0MzYsImlkIjoiMDFhMDQ2YWUtNzgwMS03MzdlLTg3MzAtZWI1NTY5Yjk0NmUxIiwia2lkIjoiMmROU0NaSHpYX2FfcVVsLVhFWmFOSm1tYkRJeUo1VmJsZ3BjSXJnNmc5cyIsInJpZCI6IjRhNWIxNDE3LTkzYWYtNGZiYi1hOTNmLTNiYjU3NGFhOTA3NyJ9.3qHyMOLW_iLlaL0j6c5krGBrR6BrU9nwkzAExC0uH8hYuWXGj1ph79X4YNJuo_Xw3CKaqiUCW0ALaTLGHoeHAw";

async function wipeAllChats() {
  try {
    const res = await fetch(`${TURSO_URL}/v2/pipeline`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${TURSO_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: "DELETE FROM messages;" } },
          { type: "execute", stmt: { sql: "DELETE FROM pending_messages;" } },
          { type: "execute", stmt: { sql: "SELECT COUNT(*) FROM messages;" } },
          { type: "execute", stmt: { sql: "SELECT COUNT(*) FROM pending_messages;" } }
        ]
      })
    });
    const data = await res.json();
    console.log("[TURSO DB] Wipe All Chats Result:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error("[TURSO DB] Error: ", e.message);
  }
}

wipeAllChats();

