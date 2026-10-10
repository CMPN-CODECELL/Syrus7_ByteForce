import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/campusly';
const MONGODB_URI = process.env.MONGODB_URI?.trim() || LOCAL_MONGODB_URI;
const CONNECTION_OPTIONS = { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 };
let client;
let db;
let bucket;

async function connectToMongoDB(uri) {
  const nextClient = new MongoClient(uri, CONNECTION_OPTIONS);
  try {
    await nextClient.connect();
    const nextDb = nextClient.db();

    // Create indexes for efficient querying
    await nextDb.collection('messages').createIndex({ timestamp: 1 }).catch(() => {});
    await nextDb.collection('messages').createIndex({ senderEmail: 1, recipientEmail: 1 }).catch(() => {});
    await nextDb.collection('posts').createIndex({ createdAt: -1 }).catch(() => {});
    await nextDb.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});

    client = nextClient;
    db = nextDb;
    bucket = new GridFSBucket(nextDb, { bucketName: 'uploads' });
    console.log('Connected to MongoDB database:', nextDb.databaseName);
    return { db, bucket };
  } catch (error) {
    await nextClient.close().catch(() => {});
    throw error;
  }
}

export async function connectDB() {
  if (db) return { db, bucket };

  try {
    return await connectToMongoDB(MONGODB_URI);
  } catch (error) {
    if (MONGODB_URI === LOCAL_MONGODB_URI) throw error;

    console.warn('Configured MongoDB connection failed; attempting local MongoDB fallback.');
    try {
      return await connectToMongoDB(LOCAL_MONGODB_URI);
    } catch (localErr) {
      const message = localErr instanceof Error
        ? localErr.message.replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[MongoDB URI]')
        : String(localErr);
      console.error('Local MongoDB connection also failed:', message);
      throw new AggregateError([error, localErr], 'Unable to connect to configured or local MongoDB.');
    }
  }
}

export function getDB() {
  if (!db) throw new Error('Database not connected. Call connectDB first.');
  return db;
}

export function getBucket() {
  if (!bucket) throw new Error('GridFS Bucket not initialized. Call connectDB first.');
  return bucket;
}

export { ObjectId };
