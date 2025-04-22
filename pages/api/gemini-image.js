import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime-types';

export const config = { api: { bodyParser: false } };

// Helper: Guess mimetype from buffer (magic numbers)
function guessImageMimeFromBufferFromBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) return undefined;
  const sigs = [
    { magic: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg' },
    { magic: [0x89, 0x50, 0x4E, 0x47], mime: 'image/png' },
    { magic: [0x47, 0x49, 0x46, 0x38], mime: 'image/gif' },
    { magic: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp', offset: 8, check: [0x57, 0x45, 0x42, 0x50] },
  ];
  for (const sig of sigs) {
    if (sig.offset) {
      if (buffer.slice(0, 4).equals(Buffer.from(sig.magic)) && buffer.slice(sig.offset, sig.offset + 4).equals(Buffer.from(sig.check))) {
        return sig.mime;
      }
    } else {
      if (buffer.slice(0, sig.magic.length).equals(Buffer.from(sig.magic))) {
        return sig.mime;
      }
    }
  }
  return undefined;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  if (!apiKey) {
    res.status(500).json({ error: 'Gemini API key not set' });
    return;
  }
  if (!model) {
    res.status(500).json({ error: 'Gemini model not set in environment variables' });
    return;
  }
  try {
    const formidable = (await import('formidable')).default;
    // --- In-memory file buffer collection for Vercel compatibility ---
    const form = formidable({
      multiples: false,
      fileWriteStreamHandler: () => {
        // Collect file data in memory
        const chunks = [];
        const stream = new (require('stream').Writable)();
        stream._write = (chunk, encoding, callback) => {
          chunks.push(chunk);
          callback();
        };
        stream.getBuffer = () => Buffer.concat(chunks);
        return stream;
      },
    });
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Failed to parse form', details: err.message });
        return;
      }
      let file = files.file;
      if (Array.isArray(file)) file = file[0];
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      // Get the in-memory buffer
      let imageBuffer = file._writeStream && file._writeStream.getBuffer ? file._writeStream.getBuffer() : null;
      if (!imageBuffer) {
        res.status(500).json({ error: 'Failed to read uploaded file buffer' });
        return;
      }
      // Infer mimetype if missing or generic
      let mimetype = file.mimetype;
      let debugInfo = {
        originalFilename: file.originalFilename,
        bufferLength: imageBuffer.length
      };
      if (!mimetype || mimetype === 'application/octet-stream') {
        let ext = '';
        if (file.originalFilename) ext = path.extname(file.originalFilename);
        mimetype = mime.lookup(ext) || undefined;
        debugInfo.inferredExt = ext;
        debugInfo.inferredMime = mimetype;
        if (!mimetype) {
          // fallback: guess from first bytes
          mimetype = guessImageMimeFromBufferFromBuffer(imageBuffer);
          debugInfo.magicMime = mimetype;
        }
      }
      console.log('[Gemini Debug]', debugInfo);
      if (!mimetype) {
        res.status(500).json({ error: 'File mimetype missing or could not be inferred', debugInfo });
        return;
      }
      // Gemini Vision expects inlineData with base64 data
      const ai = new GoogleGenAI({ apiKey });
      const contents = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: mimetype,
              },
            },
            {
              text: 'Extract all text from this image as clearly as possible.'
            },
          ],
        },
      ];
      let responseStream;
      try {
        responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            responseMimeType: 'text/plain',
          },
        });
      } catch (genErr) {
        res.status(500).json({ error: 'Gemini Vision API error', details: genErr.message });
        return;
      }
      let text = '';
      try {
        for await (const chunk of responseStream) {
          if (chunk && chunk.text) text += chunk.text;
        }
      } catch (streamErr) {
        res.status(500).json({ error: 'Error streaming Gemini Vision response', details: streamErr.message });
        return;
      }
      if (text) {
        res.status(200).json({ text });
      } else {
        res.status(500).json({ error: 'No text extracted from image' });
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error', details: e.message });
  }
}
