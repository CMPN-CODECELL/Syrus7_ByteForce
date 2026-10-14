import express from 'express';
import { getDB, ObjectId } from '../db.js';
import { broadcastChatMessage, broadcastMessageDeleted, broadcastConversationDeleted, broadcastMessageEdited } from '../ws.js';

const router = express.Router();

const MODERATOR_EMAILS = ['jainilmutha2008@gmail.com', 'ayushbsingh15@gmail.com'];

// Get list of conversations for a user
router.get('/conversations', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email parameter is required' });

    const db = getDB();

    // Find all users this user has exchanged messages with (excluding messages deleted for this user)
    const messages = await db.collection('messages').find({
      $or: [{ senderEmail: email }, { recipientEmail: email }],
      deletedFor: { $ne: email },
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
      ],
      deletedFor: { $ne: user1 },
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
      deletedFor: [],
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

// Delete message (Delete for me only unless moderator)
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

    const isMod = MODERATOR_EMAILS.includes(userEmail?.toLowerCase());
    if (!isMod && msg.senderEmail !== userEmail && msg.recipientEmail !== userEmail) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    if (isMod) {
      // Moderator deletes for everyone
      await db.collection('messages').deleteOne(query);
      broadcastMessageDeleted({
        messageId: id,
        senderEmail: msg.senderEmail,
        recipientEmail: msg.recipientEmail,
      });
      return res.json({ success: true, messageId: id, deletedForEveryone: true });
    }

    // Regular user deletes: "Delete for me" only — DO NOT delete for the other person!
    await db.collection('messages').updateOne(query, {
      $addToSet: { deletedFor: userEmail }
    });

    // If both participants have deleted it, purge it completely from DB
    const updated = await db.collection('messages').findOne(query);
    if (
      updated &&
      updated.deletedFor &&
      updated.deletedFor.includes(msg.senderEmail) &&
      updated.deletedFor.includes(msg.recipientEmail)
    ) {
      await db.collection('messages').deleteOne(query);
    }

    // Only respond to deleter; do not broadcast deletion to the other participant
    res.json({ success: true, messageId: id, deletedFor: userEmail });
  } catch (error) {
    console.error('Failed to delete message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Edit own message
router.patch('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail, text } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required to verify ownership' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty' });
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

    const isMod = MODERATOR_EMAILS.includes(userEmail?.toLowerCase());
    if (!isMod && msg.senderEmail !== userEmail) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    const updatedText = text.trim();
    const now = new Date();
    await db.collection('messages').updateOne(query, {
      $set: {
        text: updatedText,
        edited: true,
        editedAt: now,
      }
    });

    const updatedMsg = { ...msg, text: updatedText, edited: true, editedAt: now };

    // Broadcast edit in real time
    broadcastMessageEdited(updatedMsg);

    res.json(updatedMsg);
  } catch (error) {
    console.error('Failed to edit message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Report direct message
router.post('/messages/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Inappropriate direct message', reporterEmail = '' } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid message ID' });

    const db = getDB();
    await db.collection('messages').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { reported: true, reportReason: reason, reporterEmail },
        $push: { reports: { reason, reporterEmail, createdAt: new Date() } }
      }
    );
    res.json({ reported: true, messageId: id });
  } catch (error) {
    console.error('Failed to report direct message:', error);
    res.status(500).json({ error: 'Failed to report message' });
  }
});

// Get reported direct messages (moderator)
router.get('/reported-messages', async (req, res) => {
  try {
    const db = getDB();
    const reported = await db.collection('messages').find({
      $or: [{ reported: true }, { 'reports.0': { $exists: true } }]
    }).sort({ timestamp: -1 }).toArray();
    res.json(reported);
  } catch (error) {
    console.error('Failed to get reported direct messages:', error);
    res.status(500).json({ error: 'Failed to get reported messages' });
  }
});

// Delete whole conversation between two users
router.delete('/conversations', async (req, res) => {
  try {
    const { user1, user2, userEmail } = req.body;
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'user1 and user2 parameters required' });
    }

    const requester = userEmail || user1;
    const isMod = MODERATOR_EMAILS.includes(requester?.toLowerCase());
    const db = getDB();

    if (isMod) {
      await db.collection('messages').deleteMany({
        $or: [
          { senderEmail: user1, recipientEmail: user2 },
          { senderEmail: user2, recipientEmail: user1 },
        ],
      });
      broadcastConversationDeleted(user1, user2);
    } else {
      // User deletes for themselves only: mark deletedFor
      await db.collection('messages').updateMany(
        {
          $or: [
            { senderEmail: user1, recipientEmail: user2 },
            { senderEmail: user2, recipientEmail: user1 },
          ],
        },
        {
          $addToSet: { deletedFor: requester }
        }
      );
      // Clean up messages deleted by both
      await db.collection('messages').deleteMany({
        $or: [
          { senderEmail: user1, recipientEmail: user2 },
          { senderEmail: user2, recipientEmail: user1 },
        ],
        deletedFor: { $all: [user1, user2] }
      });
    }

    res.json({ success: true, user1, user2 });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
