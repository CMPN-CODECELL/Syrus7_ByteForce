import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { getDB, getBucket, ObjectId } from '../db.js';

const router = express.Router();

const MODERATOR_EMAILS = ['jainilmutha2008@gmail.com', 'ayushbsingh15@gmail.com'];

// Get profile by username
router.get('/by-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    const db = getDB();
    const user = await db.collection('users').findOne({
      $or: [
        { username: cleanUsername },
        { username: `@${cleanUsername}` },
        { name: new RegExp(`^${cleanUsername}$`, 'i') },
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by username:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get profile by email
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const db = getDB();
    const user = await db.collection('users').findOne({ email: decodeURIComponent(email) });

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
      college,
      avatar,
      username,
      year,
      branch,
      interests,
      bio,
      skills,
      supabaseId,
    } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const db = getDB();
    const setFields = {
      email,
      updatedAt: new Date(),
    };
    if (name !== undefined) setFields.name = name || email.split('@')[0];
    if (college !== undefined) setFields.college = college;
    if (avatar !== undefined) setFields.avatar = avatar;
    if (username !== undefined) setFields.username = (username || '').trim();
    if (year !== undefined) setFields.year = (year || '').trim();
    if (branch !== undefined) setFields.branch = (branch || '').trim();
    if (interests !== undefined) setFields.interests = interests;
    if (bio !== undefined) setFields.bio = bio;
    if (skills !== undefined) setFields.skills = skills;
    if (supabaseId !== undefined) setFields.supabaseId = supabaseId;

    if (MODERATOR_EMAILS.includes(email.toLowerCase())) {
      setFields.isModerator = true;
      setFields.role = 'moderator';
    }

    const updateDoc = {
      $set: setFields,
      $setOnInsert: {
        createdAt: new Date(),
        avatar: avatar || 'default-avatar.svg',
        college: college || 'College not selected',
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
    const users = await db.collection('users').find({}).project({ email: 1, name: 1, college: 1, avatar: 1, username: 1, year: 1, branch: 1, isModerator: 1 }).toArray();
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
