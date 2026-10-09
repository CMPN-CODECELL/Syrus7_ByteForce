import express from 'express';
import { getDB, ObjectId } from '../db.js';
import { broadcastCommunityMessage } from '../ws.js';

const router = express.Router();

// Get all communities
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const communities = await db.collection('communities')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json(communities);
  } catch (error) {
    console.error('Failed to get communities:', error);
    res.status(500).json({ error: 'Failed to retrieve communities' });
  }
});

// Create community
router.post('/', async (req, res) => {
  try {
    const { name, description = '', category = 'General', creator = 'Anonymous', creatorEmail = '' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Community name is required' });

    const db = getDB();
    const communityDoc = {
      name: name.trim(),
      description: description.trim(),
      category,
      creator,
      creatorEmail,
      members: creatorEmail ? [creatorEmail] : ['member'],
      memberCount: 1,
      createdAt: new Date(),
    };

    const result = await db.collection('communities').insertOne(communityDoc);
    res.status(201).json({ ...communityDoc, _id: result.insertedId });
  } catch (error) {
    console.error('Failed to create community:', error);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

// Join / Leave community
router.post('/:id/toggle-membership', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail = 'guest' } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const db = getDB();
    const community = await db.collection('communities').findOne({ _id: new ObjectId(id) });
    if (!community) return res.status(404).json({ error: 'Community not found' });

    let members = community.members || [];
    const isMember = members.includes(userEmail);

    if (isMember) {
      members = members.filter(m => m !== userEmail);
    } else {
      members.push(userEmail);
    }

    const memberCount = Math.max(0, members.length);
    await db.collection('communities').updateOne(
      { _id: new ObjectId(id) },
      { $set: { members, memberCount } }
    );

    res.json({ isMember: !isMember, memberCount });
  } catch (error) {
    console.error('Failed to update membership:', error);
    res.status(500).json({ error: 'Failed to update membership' });
  }
});

// Get community messages
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const messages = await db.collection('community_messages')
      .find({ communityId: id })
      .sort({ createdAt: 1 })
      .limit(300)
      .toArray();
    res.json(messages);
  } catch (error) {
    console.error('Failed to get community messages:', error);
    res.status(500).json({ error: 'Failed to retrieve community messages' });
  }
});

// Send a message to community chat
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      senderEmail,
      senderName = 'Campus Student',
      text = '',
      avatar = 'S',
      color = 'avatar-blue',
      attachments = [],
    } = req.body;

    if (!text.trim() && attachments.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const db = getDB();
    const messageDoc = {
      communityId: id,
      senderEmail: senderEmail || 'student@campus.edu',
      senderName: senderName || 'Campus Student',
      avatar: avatar || 'S',
      color: color || 'avatar-blue',
      text: text.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: new Date(),
    };

    const result = await db.collection('community_messages').insertOne(messageDoc);
    const createdMsg = { ...messageDoc, _id: result.insertedId };

    // Broadcast in real time via WebSocket to all connected students
    broadcastCommunityMessage(id, createdMsg);

    res.status(201).json(createdMsg);
  } catch (error) {
    console.error('Failed to send community message:', error);
    res.status(500).json({ error: 'Failed to send community message' });
  }
});

// Delete message in community chat
router.delete('/:id/messages/:messageId', async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { userEmail } = req.body;

    if (!ObjectId.isValid(messageId)) return res.status(400).json({ error: 'Invalid message ID' });

    const db = getDB();
    const msg = await db.collection('community_messages').findOne({ _id: new ObjectId(messageId) });
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    if (userEmail && msg.senderEmail && msg.senderEmail !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized to delete this message' });
    }

    await db.collection('community_messages').deleteOne({ _id: new ObjectId(messageId) });
    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Failed to delete community message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Clear community chat (by community creator)
router.delete('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    const db = getDB();
    if (ObjectId.isValid(id)) {
      const comm = await db.collection('communities').findOne({ _id: new ObjectId(id) });
      if (comm && comm.creatorEmail && userEmail && comm.creatorEmail !== userEmail) {
        return res.status(403).json({ error: 'Only community creator can clear chat' });
      }
    }

    await db.collection('community_messages').deleteMany({ communityId: id });
    res.json({ success: true, communityId: id });
  } catch (error) {
    console.error('Failed to clear community chat:', error);
    res.status(500).json({ error: 'Failed to clear community chat' });
  }
});

export default router;
