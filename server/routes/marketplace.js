import express from 'express';
import { getDB, ObjectId } from '../db.js';

const router = express.Router();

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
    const {
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

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
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

export default router;
