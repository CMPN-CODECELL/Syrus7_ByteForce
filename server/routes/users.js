import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { getDB, getBucket, ObjectId } from '../db.js';

const router = express.Router();

// Get profile by email
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const db = getDB();
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Upsert / sync user profile (called on login/signup or profile update)
router.post('/sync', async (req, res) => {
  try {
    const {
      email,
      name,
      college = 'College not selected',
      avatar = 'default-avatar.svg',
      username = '',
      year = '',
      branch = '',
      interests = [],
      bio = '',
      skills = [],
      supabaseId = null,
    } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const db = getDB();
    const updateDoc = {
      $set: {
        email,
        name: name || email.split('@')[0],
        college,
        avatar,
        username: (username || '').trim(),
        year: (year || '').trim(),
        branch: (branch || '').trim(),
        interests,
        bio,
        skills,
        supabaseId,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };

    const result = await db.collection('users').findOneAndUpdate(
      { email },
      updateDoc,
      { upsert: true, returnDocument: 'after' }
    );

    res.json(result);
  } catch (error) {
    console.error('Error syncing profile:', error);
    res.status(500).json({ error: 'Failed to sync user profile' });
  }
});

// List all campus students for community/chats discovery
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection('users').find({}).project({ email: 1, name: 1, college: 1, avatar: 1, username: 1, year: 1, branch: 1 }).toArray();
    res.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

router.delete('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);
    const db = getDB();

    const user = await db.collection('users').findOne({ email: decodedEmail });
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const bucket = getBucket();
    const userOwnedPosts = await db.collection('posts').find({ authorEmail: decodedEmail }).toArray();
    for (const post of userOwnedPosts) {
      for (const attachment of post.attachments || []) {
        if (attachment.fileId && ObjectId.isValid(attachment.fileId)) {
          try {
            await bucket.delete(new ObjectId(attachment.fileId));
          } catch {}
        }
      }
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ceiijirjiqjhqzhwacio.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data, error } = await supabase.auth.admin.listUsers();
        if (!error) {
          const supabaseUser = data?.users?.find(u => u.email?.toLowerCase() === decodedEmail.toLowerCase());
          if (supabaseUser) {
            await supabase.auth.admin.deleteUser(supabaseUser.id);
          }
        }
      } catch (supabaseError) {
        console.warn('Supabase Auth cleanup skipped for this account:', supabaseError.message || supabaseError);
      }
    }

    await db.collection('posts').deleteMany({ authorEmail: decodedEmail });
    await db.collection('messages').deleteMany({ $or: [{ senderEmail: decodedEmail }, { recipientEmail: decodedEmail }] });
    await db.collection('communityMessages').deleteMany({ senderEmail: decodedEmail });
    await db.collection('users').deleteOne({ email: decodedEmail });

    res.json({ success: true, deletedEmail: decodedEmail });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Failed to delete account and related records' });
  }
});

export default router;
