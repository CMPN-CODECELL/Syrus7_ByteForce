import express from 'express';
import { getDB, ObjectId } from '../db.js';

const router = express.Router();

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
      createdAt: new Date(),
      time: 'Just now',
    };

    const result = await db.collection('posts').insertOne(postDoc);
    res.status(201).json({ ...postDoc, _id: result.insertedId });
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
    const { text, author = 'Anonymous', avatar = 'A', color = 'avatar-blue' } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text required' });
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID' });

    const db = getDB();
    const replyItem = {
      _id: new ObjectId(),
      text: text.trim(),
      author,
      avatar,
      color,
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

// Delete own post / discussion
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { authorEmail, author } = req.body;

    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID' });

    const db = getDB();
    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const postOwner = post.authorEmail || post.ownerEmail;
    if (authorEmail && postOwner && postOwner !== authorEmail) {
      return res.status(403).json({ error: 'You can only delete your own discussions' });
    }

    await db.collection('posts').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, postId: id });
  } catch (error) {
    console.error('Failed to delete post:', error);
    res.status(500).json({ error: 'Failed to delete discussion' });
  }
});

export default router;
