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

// Get opportunities
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const list = await db.collection('opportunities')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json(list);
  } catch (error) {
    console.error('Failed to get opportunities:', error);
    res.status(500).json({ error: 'Failed to retrieve opportunities' });
  }
});

// Create opportunity
router.post('/', async (req, res) => {
  try {
    const {
      title,
      company,
      type = 'Internship',
      deadline = 'Open',
      eligibility = 'All students',
      logo = 'C',
      link = '',
      image = '',
      postedBy = '',
    } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: 'Title and company are required' });
    }

    if (isContentInappropriate(title) || isContentInappropriate(company)) {
      return res.status(400).json({
        error: 'Opportunity violates campus safety policy. Inappropriate or prohibited words are not allowed.'
      });
    }

    const formattedLink = link ? (link.startsWith('http://') || link.startsWith('https://') ? link.trim() : `https://${link.trim()}`) : '';

    const db = getDB();
    const doc = {
      title: title.trim(),
      company: company.trim(),
      type,
      deadline,
      eligibility,
      logo,
      link: formattedLink,
      image: image || '',
      postedBy: postedBy || '',
      savedBy: [],
      appliedBy: [],
      createdAt: new Date(),
    };

    const result = await db.collection('opportunities').insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (error) {
    console.error('Failed to create opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Apply to opportunity
router.post('/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail = 'guest' } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const db = getDB();
    await db.collection('opportunities').updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { appliedBy: userEmail } }
    );
    res.json({ applied: true });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ error: 'Failed to apply' });
  }
});

// Toggle save opportunity
router.post('/:id/toggle-save', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail = 'guest' } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const db = getDB();
    const opp = await db.collection('opportunities').findOne({ _id: new ObjectId(id) });
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

    let savedBy = opp.savedBy || [];
    const isSaved = savedBy.includes(userEmail);

    if (isSaved) {
      savedBy = savedBy.filter(e => e !== userEmail);
    } else {
      savedBy.push(userEmail);
    }

    await db.collection('opportunities').updateOne(
      { _id: new ObjectId(id) },
      { $set: { savedBy } }
    );

    res.json({ isSaved: !isSaved });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to toggle save' });
  }
});

// Delete opportunity (creator or moderator)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const db = getDB();
    const opp = await db.collection('opportunities').findOne({ _id: new ObjectId(id) });
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

    const isMod = MODERATOR_EMAILS.includes(userEmail?.toLowerCase());
    if (!isMod && userEmail && opp.postedBy && opp.postedBy !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized to delete this opportunity' });
    }

    await db.collection('opportunities').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, id });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

export default router;
