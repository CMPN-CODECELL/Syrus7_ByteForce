import express from 'express';
import { getDB, ObjectId } from '../db.js';

const router = express.Router();

const MODERATOR_EMAILS = ['jainilmutha2008@gmail.com', 'ayushbsingh15@gmail.com'];

const BANNED_WORDS = [
  'porn', 'sex', 'ass', 'bad ass', 'mother fucker', 'motherfucker', 'nude',
  'dick', 'pussy', 'bitch', 'cock', 'boobs', 'cunt', 'whore', 'slut', 'fuck'
];

function isContentInappropriate(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(w => {
    const regex = new RegExp(`\\b${w.replace(/\s+/g, '\\s+')}\\b`, 'i');
    return regex.test(lower);
  });
}

// Get all marketplace listings
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const items = await db.collection('marketplace')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json(items);
  } catch (error) {
    console.error('Failed to get marketplace items:', error);
    res.status(500).json({ error: 'Failed to retrieve marketplace items' });
  }
});

// Create product listing
router.post('/', async (req, res) => {
  try {
    let {
      title,
      price,
      type = 'Sale',
      condition = 'Good',
      category = 'General',
      sellerName = 'Anonymous',
      sellerEmail = '',
      image = '',
      fileId = null,
    } = req.body;

    if (type === 'Donate') {
      price = 'Free';
    }

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }

    if (isContentInappropriate(title) || isContentInappropriate(category)) {
      return res.status(400).json({
        error: 'Listing violates campus safety policy. Inappropriate or prohibited words are not allowed.'
      });
    }

    const db = getDB();
    const itemDoc = {
      title: title.trim(),
      price: price.trim(),
      type,
      condition,
      category,
      sellerName,
      sellerEmail,
      image,
      fileId,
      savedBy: [],
      createdAt: new Date(),
    };

    const result = await db.collection('marketplace').insertOne(itemDoc);
    res.status(201).json({ ...itemDoc, _id: result.insertedId });
  } catch (error) {
    console.error('Failed to create listing:', error);
    res.status(500).json({ error: 'Failed to create listing in MongoDB' });
  }
});

// Toggle save listing
router.post('/:id/toggle-save', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail = 'guest' } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const db = getDB();
    const item = await db.collection('marketplace').findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: 'Listing not found' });

    let savedBy = item.savedBy || [];
    const isSaved = savedBy.includes(userEmail);

    if (isSaved) {
      savedBy = savedBy.filter(e => e !== userEmail);
    } else {
      savedBy.push(userEmail);
    }

    await db.collection('marketplace').updateOne(
      { _id: new ObjectId(id) },
      { $set: { savedBy } }
    );

    res.json({ isSaved: !isSaved });
  } catch (error) {
    console.error('Failed to toggle save:', error);
    res.status(500).json({ error: 'Failed to toggle save' });
  }
});

// Delete marketplace listing (seller or moderator)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const db = getDB();
    const item = await db.collection('marketplace').findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: 'Listing not found' });

    const isMod = MODERATOR_EMAILS.includes(userEmail?.toLowerCase());
    if (!isMod && userEmail && item.sellerEmail && item.sellerEmail !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized to delete this listing' });
    }

    await db.collection('marketplace').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete marketplace listing:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

export default router;
