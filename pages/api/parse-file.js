import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseImageWithGemini(filePath, mimetype, baseUrl) {
  // Read the image buffer
  const imageBuffer = fs.readFileSync(filePath);
  // Use FormData to send file and prompt to Gemini Vision API endpoint
  const form = new FormData();
  form.append('file', new Blob([imageBuffer]), 'image');
  form.append('prompt', 'Extract all text from this image as clearly as possible.');
  // Use absolute URL for API endpoint
  const apiRes = await fetch(`${baseUrl}/api/gemini-image`, {
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
    // Fallback: infer mimetype from extension if missing or generic
    if (!file || !file.mimetype || file.mimetype === 'application/octet-stream') {
      let ext = '';
      if (file && file.originalFilename) {
        ext = file.originalFilename.split('.').pop().toLowerCase();
      }
      // Map extension to mimetype
      const extToMime = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', bmp: 'image/bmp', gif: 'image/gif', tiff: 'image/tiff',
        heic: 'image/heic', heif: 'image/heif',
      };
      if (ext && extToMime[ext]) {
        file.mimetype = extToMime[ext];
      }
    }
    if (!file || !file.mimetype) {
      console.error('[parse-file] No file or mimetype. files:', files, 'file:', file);
      res.status(400).json({ error: 'No file or mimetype received (even after extension fallback)', files, file });
      return;
    }
    let text = '';
    try {
      console.log('[parse-file] Uploaded file:', file);
      // Dynamically compute base URL for server-side fetch
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      if (file.mimetype.startsWith('image/')) {
        text = await parseImageWithGemini(file.filepath, file.mimetype, baseUrl);
      } else if (file.mimetype === 'application/pdf') {
        text = await parsePdfFile(file.filepath);
      } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
      ) {
        text = await parseDocxFile(file.filepath);
      } else if (
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        text = '[Excel file support coming soon: file accepted, but not parsed]';
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
