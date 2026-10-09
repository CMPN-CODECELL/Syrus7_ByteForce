import express from 'express';
import multer from 'multer';
import { getBucket, getDB, ObjectId } from '../db.js';
import { Readable } from 'stream';

const router = express.Router();
const upload = multer({
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max per file
});

// Upload one or multiple files directly to MongoDB GridFS
router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided for upload' });
    }

    const bucket = getBucket();
    const uploaded = [];

    for (const file of req.files) {
      const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date(),
        },
      });

      const readable = Readable.from(file.buffer);
      await new Promise((resolve, reject) => {
        readable.pipe(uploadStream)
          .on('error', reject)
          .on('finish', () => {
            uploaded.push({
              fileId: uploadStream.id.toString(),
              filename: file.originalname,
              contentType: file.mimetype,
              size: file.size,
              url: `/api/files/${uploadStream.id}`,
            });
            resolve();
          });
      });
    }

    res.json({ files: uploaded });
  } catch (error) {
    console.error('File upload to MongoDB failed:', error);
    res.status(500).json({ error: 'Failed to store file in MongoDB' });
  }
});

// Stream file directly from MongoDB by its ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    const bucket = getBucket();
    const db = getDB();
    const fileDoc = await db.collection('uploads.files').findOne({ _id: new ObjectId(id) });

    if (!fileDoc) {
      return res.status(404).json({ error: 'File not found in MongoDB' });
    }

    const contentType = fileDoc.contentType || fileDoc.metadata?.contentType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileDoc.length);
    res.setHeader('Content-Disposition', `inline; filename="${fileDoc.metadata?.originalName || fileDoc.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    const downloadStream = bucket.openDownloadStream(new ObjectId(id));
    downloadStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) res.status(500).end();
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error retrieving file from MongoDB:', error);
    res.status(500).json({ error: 'Failed to retrieve file from MongoDB' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    const bucket = getBucket();
    await bucket.delete(new ObjectId(id));
    res.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting file from MongoDB:', error);
    res.status(500).json({ error: 'Failed to delete file from MongoDB' });
  }
});

export default router;
