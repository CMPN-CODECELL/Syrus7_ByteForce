import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusly';
let client;
let db;
let bucket;

export async function connectDB() {
  if (db) return { db, bucket };
  try {
    client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
    await client.connect();
    db = client.db('campusly');
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('Connected to MongoDB database:', db.databaseName);
    
    // Create indexes for efficient querying
    await db.collection('messages').createIndex({ timestamp: 1 }).catch(() => {});
    await db.collection('messages').createIndex({ senderEmail: 1, recipientEmail: 1 }).catch(() => {});
    await db.collection('posts').createIndex({ createdAt: -1 }).catch(() => {});
    await db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});
    
    return { db, bucket };
  } catch (error) {
    console.warn('Primary MongoDB connection failed, attempting local MongoDB (mongodb://127.0.0.1:27017/campusly)...');
    try {
      client = new MongoClient('mongodb://127.0.0.1:27017/campusly');
      await client.connect();
      db = client.db('campusly');
      bucket = new GridFSBucket(db, { bucketName: 'uploads' });
      console.log('Connected to local MongoDB database:', db.databaseName);

      await db.collection('messages').createIndex({ timestamp: 1 }).catch(() => {});
      await db.collection('messages').createIndex({ senderEmail: 1, recipientEmail: 1 }).catch(() => {});
      await db.collection('posts').createIndex({ createdAt: -1 }).catch(() => {});
      await db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});

      return { db, bucket };
    } catch (localErr) {
      console.error('Local MongoDB connection also failed:', localErr);
      throw error;
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
