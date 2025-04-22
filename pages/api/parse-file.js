import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseImageWithGemini(filePath, mimetype) {
  // Read the image buffer
  const imageBuffer = fs.readFileSync(filePath);
  // Use FormData to send file and prompt to Gemini Vision API endpoint
  const form = new FormData();
  form.append('file', new Blob([imageBuffer]), 'image');
  form.append('prompt', 'Extract all text from this image as clearly as possible.');
  // Use relative path for API endpoint to work both locally and on Vercel
  const apiRes = await fetch('/api/gemini-image', {
    method: 'POST',
    body: form,
  });
  const apiJson = await apiRes.json();
  if (apiJson.text) return apiJson.text;
  throw new Error(apiJson.error || 'Gemini Vision API failed');
}

async function parsePdfFile(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

async function parseDocxFile(filePath) {
  const { value } = await mammoth.extractRawText({ path: filePath });
  return value;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('[parse-file] Formidable error:', err);
      res.status(500).json({ error: 'Failed to parse form', details: err.message });
      return;
    }
    let file = files.file;
    if (Array.isArray(file)) file = file[0];
    if (!file || !file.mimetype) {
      console.error('[parse-file] No file or mimetype. files:', files, 'file:', file);
      res.status(400).json({ error: 'No file or mimetype received', files, file });
      return;
    }
    let text = '';
    try {
      console.log('[parse-file] Uploaded file:', file);
      if (file.mimetype.startsWith('image/')) {
        text = await parseImageWithGemini(file.filepath, file.mimetype);
      } else if (file.mimetype === 'application/pdf') {
        text = await parsePdfFile(file.filepath);
      } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
      ) {
        text = await parseDocxFile(file.filepath);
      } else {
        console.error('[parse-file] Unsupported file type:', file.mimetype);
        res.status(400).json({ error: 'Unsupported file type', mimetype: file.mimetype });
        return;
      }
      if (!text.trim()) throw new Error('No text extracted');
      res.status(200).json({ text });
    } catch (e) {
      console.error('[parse-file] Failed to parse file:', e);
      res.status(500).json({ error: 'Failed to parse file: ' + e.message });
    } finally {
      fs.unlink(file.filepath, () => {});
    }
  });
}
