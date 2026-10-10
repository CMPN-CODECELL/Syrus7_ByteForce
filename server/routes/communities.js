import express from 'express';
import { getDB, ObjectId } from '../db.js';
import { broadcastCommunityMessage, broadcastCommunityMessageEdited } from '../ws.js';

const router = express.Router();

const MODERATOR_EMAILS = ['jainilmutha2008@gmail.com', 'ayushbsingh15@gmail.com'];

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
    const { name, description = '', category = 'General', creator = 'Anonymous', creatorEmail = '', image = '' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Community name is required' });

    const db = getDB();
    const communityDoc = {
      name: name.trim(),
      description: description.trim(),
      category,
      creator,
      creatorEmail,
      image: image || '',
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

    const isMod = MODERATOR_EMAILS.includes(userEmail?.toLowerCase());
    if (!isMod && userEmail && msg.senderEmail && msg.senderEmail !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized to delete this message' });
    }

    await db.collection('community_messages').deleteOne({ _id: new ObjectId(messageId) });
    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Failed to delete community message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Edit message in community chat
router.patch('/:id/messages/:messageId', async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { userEmail, text } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required to verify ownership' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty' });
    }
    if (!ObjectId.isValid(messageId)) return res.status(400).json({ error: 'Invalid message ID' });

    const db = getDB();
    const query = { _id: new ObjectId(messageId) };
    const msg = await db.collection('community_messages').findOne(query);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const isMod = MODERATOR_EMAILS.includes(userEmail?.toLowerCase());
    if (!isMod && msg.senderEmail && msg.senderEmail !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized to edit this message' });
    }

    const updatedText = text.trim();
    const now = new Date();
    await db.collection('community_messages').updateOne(query, {
      $set: { text: updatedText, edited: true, editedAt: now }
    });

    const updatedMsg = { ...msg, text: updatedText, edited: true, editedAt: now };
    broadcastCommunityMessageEdited(id, updatedMsg);

    res.json(updatedMsg);
  } catch (error) {
    console.error('Failed to edit community message:', error);
    res.status(500).json({ error: 'Failed to edit community message' });
  }
});

// Delete whole community (creator or moderator)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const db = getDB();
    const comm = await db.collection('communities').findOne({ _id: new ObjectId(id) });
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const isMod = MODERATOR_EMAILS.includes(userEmail?.toLowerCase());
    if (!isMod && userEmail && comm.creatorEmail && comm.creatorEmail !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized to delete this community' });
    }

    await db.collection('communities').deleteOne({ _id: new ObjectId(id) });
    await db.collection('community_messages').deleteMany({ communityId: id });
    res.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete community:', error);
    res.status(500).json({ error: 'Failed to delete community' });
  }
});

// Report a community message
router.post('/:id/messages/:messageId/report', async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { reason = 'Inappropriate message', reporterEmail = '' } = req.body;
    if (!ObjectId.isValid(messageId)) return res.status(400).json({ error: 'Invalid message ID' });

    const db = getDB();
    await db.collection('community_messages').updateOne(
      { _id: new ObjectId(messageId) },
      {
        $set: { reported: true, reportReason: reason, reporterEmail },
        $push: { reports: { reason, reporterEmail, createdAt: new Date() } }
      }
    );
    res.json({ reported: true, messageId });
  } catch (error) {
    console.error('Failed to report community message:', error);
    res.status(500).json({ error: 'Failed to report message' });
  }
});

// Get reported community messages (moderator)
router.get('/reported-messages', async (req, res) => {
  try {
    const db = getDB();
    const reported = await db.collection('community_messages').find({
      $or: [{ reported: true }, { 'reports.0': { $exists: true } }]
    }).sort({ createdAt: -1 }).toArray();
    res.json(reported);
  } catch (error) {
    console.error('Failed to get reported community messages:', error);
    res.status(500).json({ error: 'Failed to get reported messages' });
  }
});

// Clear community chat (by community creator or moderator)
router.delete('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    const db = getDB();
    if (ObjectId.isValid(id)) {
      const comm = await db.collection('communities').findOne({ _id: new ObjectId(id) });
      const isMod = MODERATOR_EMAILS.includes(userEmail?.toLowerCase());
      if (!isMod && comm && comm.creatorEmail && userEmail && comm.creatorEmail !== userEmail) {
        return res.status(403).json({ error: 'Only community creator or moderator can clear chat' });
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
