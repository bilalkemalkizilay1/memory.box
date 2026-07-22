const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function main() {
  const db = await open({
    filename: 'memory_box.db',
    driver: sqlite3.Database
  });
  const res = await db.run("UPDATE pins SET spotify_track_id = '531225131'");
  console.log("Database updated successfully with Deezer ID, rows modified:", res.changes);
}

main().catch(console.error);
