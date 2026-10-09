import express from 'express';
import { getDB, ObjectId } from '../db.js';
import { broadcastChatMessage, broadcastMessageDeleted, broadcastConversationDeleted } from '../ws.js';

const router = express.Router();

// Get list of conversations for a user
router.get('/conversations', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email parameter is required' });

    const db = getDB();

    // Find all users this user has exchanged messages with
    const messages = await db.collection('messages').find({
      $or: [{ senderEmail: email }, { recipientEmail: email }]
    }).sort({ timestamp: -1 }).toArray();

    const convMap = new Map();

    for (const msg of messages) {
      const otherEmail = msg.senderEmail === email ? msg.recipientEmail : msg.senderEmail;
      const otherName = msg.senderEmail === email ? (msg.recipientName || otherEmail) : (msg.senderName || otherEmail);

      if (!convMap.has(otherEmail)) {
        convMap.set(otherEmail, {
          email: otherEmail,
          name: otherName,
          lastMessage: msg.text || (msg.attachments?.length ? `[Attachment: ${msg.attachments[0].name}]` : ''),
          timestamp: msg.timestamp,
        });
      }
    }

    // Also get all other registered users on campus who can be chatted with
    const campusUsers = await db.collection('users').find({
      email: { $ne: email }
    }).project({ email: 1, name: 1, college: 1, avatar: 1 }).toArray();

    for (const u of campusUsers) {
      if (!convMap.has(u.email)) {
        convMap.set(u.email, {
          email: u.email,
          name: u.name || u.email.split('@')[0],
          lastMessage: 'Tap to start conversation',
          timestamp: null,
          college: u.college,
        });
      }
    }

    res.json(Array.from(convMap.values()));
  } catch (error) {
    console.error('Failed to get conversations:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

// Get messages between two users
router.get('/messages', async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'user1 and user2 parameters required' });
    }

    const db = getDB();
    const messages = await db.collection('messages').find({
      $or: [
        { senderEmail: user1, recipientEmail: user2 },
        { senderEmail: user2, recipientEmail: user1 },
      ]
    }).sort({ timestamp: 1 }).toArray();

    res.json(messages);
  } catch (error) {
    console.error('Failed to get messages:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// Send a new message (persists to MongoDB and triggers WebSocket broadcast)
router.post('/messages', async (req, res) => {
  try {
    const {
      senderEmail,
      senderName = 'Anonymous',
      recipientEmail,
      recipientName = 'Student',
      text = '',
      attachments = [],
    } = req.body;

    if (!senderEmail || !recipientEmail) {
      return res.status(400).json({ error: 'senderEmail and recipientEmail required' });
    }

    if (!text.trim() && attachments.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const db = getDB();
    const messageDoc = {
      senderEmail,
      senderName,
      recipientEmail,
      recipientName,
      text: text.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      timestamp: new Date(),
      read: false,
    };

    const result = await db.collection('messages').insertOne(messageDoc);
    const createdMsg = { ...messageDoc, _id: result.insertedId };

    // Broadcast in real-time over WebSocket to both recipient and sender devices
    broadcastChatMessage(createdMsg);

    res.status(201).json(createdMsg);
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete own message
router.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.body?.userEmail || req.query?.userEmail;

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required to verify ownership' });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const db = getDB();
    const query = { _id: new ObjectId(id) };
    const msg = await db.collection('messages').findOne(query);

    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (msg.senderEmail !== userEmail) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await db.collection('messages').deleteOne(query);

    // Broadcast deletion in real time to both recipient and sender
    broadcastMessageDeleted({
      messageId: id,
      senderEmail: msg.senderEmail,
      recipientEmail: msg.recipientEmail,
    });

    res.json({ success: true, messageId: id });
  } catch (error) {
    console.error('Failed to delete message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Delete whole conversation between two users
router.delete('/conversations', async (req, res) => {
  try {
    const { user1, user2 } = req.body;
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'user1 and user2 parameters required' });
    }

    const db = getDB();
    await db.collection('messages').deleteMany({
      $or: [
        { senderEmail: user1, recipientEmail: user2 },
        { senderEmail: user2, recipientEmail: user1 },
      ],
    });

    broadcastConversationDeleted(user1, user2);
    res.json({ success: true, user1, user2 });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
