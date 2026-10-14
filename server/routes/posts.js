import express from 'express';
import { getDB, ObjectId } from '../db.js';
import { broadcastPostCreated } from '../ws.js';

const router = express.Router();

const MODERATOR_EMAILS = ['jainilmutha2008@gmail.com', 'ayushbsingh15@gmail.com'];

// Get all posts from MongoDB
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const posts = await db.collection('posts')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json(posts);
  } catch (error) {
    console.error('Failed to get posts:', error);
    res.status(500).json({ error: 'Failed to retrieve posts from MongoDB' });
  }
});

// Create a new post in MongoDB
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const {
      author = 'Anonymous',
      authorEmail = '',
      ownerEmail = '',
      avatar = 'A',
      title,
      body,
      tags = [],
      college = 'Campus Student',
      attachments = [],
      verified = false,
      color = 'avatar-blue',
      isAnonymous = false,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const resolvedEmail = (authorEmail || ownerEmail || '').trim();
    const isAnon = Boolean(isAnonymous) || author === 'Anonymous';

    const postDoc = {
      author: isAnon ? 'Anonymous' : author,
      authorEmail: resolvedEmail,
      ownerEmail: resolvedEmail,
      isAnonymous: isAnon,
      avatar: isAnon ? 'A' : avatar,
      title: title.trim(),
      body: (body || '').trim(),
      tags: Array.isArray(tags) ? tags : [],
      votes: 0,
      upvoters: [],
      downvoters: [],
      comments: 0,
      replies: [],
      color: isAnon ? 'avatar-dark' : color,
      verified: Boolean(verified),
      college,
      attachments: Array.isArray(attachments) ? attachments : [],
      flagged: Boolean(req.body.flagged),
      moderationReason: req.body.moderationReason || '',
      moderationStatus: req.body.moderationStatus || (req.body.flagged ? 'pending' : 'approved'),
      reports: [],
      createdAt: new Date(),
      time: new Date().toISOString(),
    };

    const result = await db.collection('posts').insertOne(postDoc);
    const createdDoc = { ...postDoc, _id: result.insertedId };
    broadcastPostCreated(createdDoc);
    res.status(201).json(createdDoc);
  } catch (error) {
    console.error('Failed to create post:', error);
    res.status(500).json({ error: 'Failed to create post in MongoDB' });
  }
});

// Vote on a post (up / down)
router.post('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, voterEmail = 'guest' } = req.body; // 'up' or 'down'

    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID' });

    const db = getDB();
    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    let upvoters = post.upvoters || [];
    let downvoters = post.downvoters || [];

    if (type === 'up') {
      if (upvoters.includes(voterEmail)) {
        upvoters = upvoters.filter(e => e !== voterEmail);
      } else {
        upvoters.push(voterEmail);
        downvoters = downvoters.filter(e => e !== voterEmail);
      }
    } else if (type === 'down') {
      if (downvoters.includes(voterEmail)) {
        downvoters = downvoters.filter(e => e !== voterEmail);
      } else {
        downvoters.push(voterEmail);
        upvoters = upvoters.filter(e => e !== voterEmail);
      }
    }

    const newVoteCount = upvoters.length - downvoters.length;

    await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      { $set: { votes: newVoteCount, upvoters, downvoters } }
    );

    res.json({ votes: newVoteCount, upvoted: upvoters.includes(voterEmail), downvoted: downvoters.includes(voterEmail) });
  } catch (error) {
    console.error('Failed to vote:', error);
    res.status(500).json({ error: 'Vote failed' });
  }
});

// Add comment / reply to a post thread
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      text,
      author = 'Anonymous',
      authorEmail = '',
      avatar = 'A',
      color = 'avatar-blue',
      parentId = null,
      replyingToAuthor = null,
      replyingToText = null,
    } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text required' });
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID' });

    const db = getDB();
    const replyItem = {
      _id: new ObjectId(),
      text: text.trim(),
      author,
      authorEmail,
      avatar,
      color,
      parentId,
      replyingToAuthor,
      replyingToText,
      votes: 0,
      upvoters: [],
      downvoters: [],
      createdAt: new Date(),
    };

    await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { replies: replyItem },
        $inc: { comments: 1 },
      }
    );

    res.status(201).json(replyItem);
  } catch (error) {
    console.error('Failed to add reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Vote on a comment / reply in a discussion
router.post('/:id/comments/:commentId/vote', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { type, voterEmail = 'anonymous' } = req.body;

    if (!['up', 'down'].includes(type)) return res.status(400).json({ error: 'Vote type must be "up" or "down"' });
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID' });

    const db = getDB();
    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const replies = post.replies || [];
    const commentIndex = replies.findIndex(r => r._id?.toString() === commentId);
    if (commentIndex === -1) return res.status(404).json({ error: 'Comment not found' });

    const comment = replies[commentIndex];
    let upvoters = comment.upvoters || [];
    let downvoters = comment.downvoters || [];

    if (type === 'up') {
      if (upvoters.includes(voterEmail)) {
        upvoters = upvoters.filter(e => e !== voterEmail);
      } else {
        upvoters.push(voterEmail);
        downvoters = downvoters.filter(e => e !== voterEmail);
      }
    } else if (type === 'down') {
      if (downvoters.includes(voterEmail)) {
        downvoters = downvoters.filter(e => e !== voterEmail);
      } else {
        downvoters.push(voterEmail);
        upvoters = upvoters.filter(e => e !== voterEmail);
      }
    }

    const newVoteCount = upvoters.length - downvoters.length;
    replies[commentIndex].votes = newVoteCount;
    replies[commentIndex].upvoters = upvoters;
    replies[commentIndex].downvoters = downvoters;

    await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      { $set: { replies } }
    );

    res.json({
      commentId,
      votes: newVoteCount,
      upvoted: upvoters.includes(voterEmail),
      downvoted: downvoters.includes(voterEmail),
    });
  } catch (error) {
    console.error('Failed to vote on comment:', error);
    res.status(500).json({ error: 'Vote on comment failed' });
  }
});

// Delete own comment / reply from a discussion
router.delete('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText, author, authorEmail } = req.body;

    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID' });

    const db = getDB();
    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Remove the matching reply
    const replies = post.replies || [];
    const indexToDelete = replies.findIndex(r => {
      if (req.body.commentId && r._id?.toString() === req.body.commentId) return true;
      const textMatch = r.text === replyText;
      const authorMatch = !author || r.author === author || (authorEmail && r.authorEmail === authorEmail);
      return textMatch && authorMatch;
    });

    if (indexToDelete === -1) {
      return res.status(404).json({ error: 'Reply not found or unauthorized' });
    }

    replies.splice(indexToDelete, 1);

    await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { replies },
        $set: { comments: Math.max(0, (post.comments || 1) - 1), replies }
      }
    );

    res.json({ success: true, remaining: replies.length });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    res.status(500).json({ error: 'Failed to delete discussion comment' });
  }
});

// Get all reported and flagged posts (for moderator review)
router.get('/reported', async (req, res) => {
  try {
    const db = getDB();
    const flagged = await db.collection('posts').find({
      $or: [
        { flagged: true },
        { 'reports.0': { $exists: true } },
        { moderationStatus: 'pending' },
      ]
    }).sort({ createdAt: -1 }).toArray();
    res.json(flagged);
  } catch (error) {
    console.error('Failed to fetch reported posts:', error);
    res.status(500).json({ error: 'Failed to retrieve reported posts' });
  }
});

// Delete post / discussion (owner or moderator)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { authorEmail } = req.body;

    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID' });

    const db = getDB();
    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isModerator = MODERATOR_EMAILS.includes(authorEmail?.toLowerCase());
    const postOwner = post.authorEmail || post.ownerEmail;
    if (!isModerator && authorEmail && postOwner && postOwner !== authorEmail) {
      return res.status(403).json({ error: 'You can only delete your own discussions' });
    }

    await db.collection('posts').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, postId: id });
  } catch (error) {
    console.error('Failed to delete post:', error);
    res.status(500).json({ error: 'Failed to delete discussion' });
  }
});

// Delete an image / attachment from a post (owner or moderator)
router.delete('/:id/attachments/:index', async (req, res) => {
  try {
    const { id, index } = req.params;
    const { userEmail } = req.body;
    const idx = parseInt(index, 10);
    if (!ObjectId.isValid(id) || isNaN(idx)) return res.status(400).json({ error: 'Invalid ID or index' });

    const db = getDB();
    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isMod = MODERATOR_EMAILS.includes(userEmail?.toLowerCase());
    const postOwner = post.authorEmail || post.ownerEmail;
    if (!isMod && userEmail && postOwner && postOwner !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized to delete this attachment' });
    }

    const attachments = post.attachments || [];
    if (idx < 0 || idx >= attachments.length) {
      return res.status(404).json({ error: 'Attachment index out of bounds' });
    }

    attachments.splice(idx, 1);
    await db.collection('posts').updateOne({ _id: new ObjectId(id) }, { $set: { attachments } });
    res.json({ success: true, remaining: attachments.length });
  } catch (error) {
    console.error('Failed to delete attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Report and flag a post for community moderation review
router.post('/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Content reported by student', reporterEmail = '' } = req.body;

    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID' });

    const db = getDB();
    await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          flagged: true,
          moderationReason: reason,
          moderationStatus: 'pending',
        },
        $push: {
          reports: {
            reason,
            reporterEmail,
            createdAt: new Date(),
          },
        },
      }
    );

    res.json({ success: true, flagged: true, moderationReason: reason });
  } catch (error) {
    console.error('Failed to report post:', error);
    res.status(500).json({ error: 'Failed to report post' });
  }
});

// Unflag / dismiss moderation flag on a post
router.post('/:id/unflag', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID' });

    const db = getDB();
    await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          flagged: false,
          moderationStatus: 'approved',
        },
      }
    );

    res.json({ success: true, flagged: false });
  } catch (error) {
    console.error('Failed to unflag post:', error);
    res.status(500).json({ error: 'Failed to unflag post' });
  }
});

export default router;
