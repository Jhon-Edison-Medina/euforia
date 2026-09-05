require('dotenv').config({ path: __dirname + '/backend/.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function test() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Conexión exitosa a MongoDB Atlas');
    const db = client.db('euforia');
    const collections = await db.listCollections().toArray();
    console.log('📂 Colecciones:', collections.map(c => c.name));
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

test();