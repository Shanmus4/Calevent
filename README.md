# calevents

## Project Status

**calevents is complete and live.**

- All features are implemented and tested.
- SEO, branding, timezone, and mobile handling are finalized.
- No pending or upcoming tasks.
- Ready for users and future enhancements as needed.

calevents makes it easy to turn any text, email, or message into ready-to-use Google, Outlook, or .ics calendar links. 100% free, private, and no login needed. Perfect for meetings, reminders, and events.

## Recent Updates (2025-04-22)
- Removed Tailwind CSS, PostCSS, and Autoprefixer (not used in this project).
- node_modules cleaned and minimized for deployment.
- Main frame and results section now feature smooth, modern animations.
- Timezone and mobile event time handling fixed (now always uses user's actual timezone)
- All ambiguous time logic handled by AI
- Final deployment and polish

## Features
- Turn any text into calendar links for Google, Outlook, or .ics
- Free, private, and no login needed
- Supports meetings, reminders, and all event types
- Fast, simple, and mobile-friendly
- **Drag-and-drop image upload with Gemini Vision OCR (image-to-text extraction)**
- **Robust MIME type inference for uploads (PDF, DOCX, images, etc.)**
- **ICS file download always triggers file save, not browser open**
- **No user data stored, no analytics, all secrets in .env.local**

## Security & Privacy
- All environment variables and API keys are stored in `.env.local` (never committed)
- No user data is ever stored or logged
- All event extraction and image parsing is done in-memory and deleted after use
- Calendar links and .ics files are generated client-side for privacy
- No analytics or third-party tracking
- **No geolocation, camera, or microphone permissions are ever requested**
- **Timezone is detected only via browser settings (Intl API); no location or device permissions needed**
- **Safe for public repo: no secrets, no user data, no analytics, all dependencies up to date**

## Getting Started

### 1. Clone the Repository
```sh
git clone https://github.com/Shanmus4/Calevent.git
cd Calevent
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Configure API Keys
Create a `.env.local` file in the root directory with the following environment variables:

```
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash   # or your preferred Gemini model
LOCAL_TIMEZONE=Asia/Kolkata     # or your local timezone
```
- You must obtain a Gemini API key from Google (https://aistudio.google.com/app/apikey)
- Do NOT commit `.env.local` to version control (it is gitignored by default)

### 4. Run Locally
```sh
npm run dev
```
App will be available at [http://localhost:3000](http://localhost:3000)

### 5. Deploy
- Push your forked repo to GitHub
- Deploy to [Vercel](https://vercel.com/) or your preferred platform
- Set the same environment variables in your deployment dashboard

Live: https://calevents.vercel.app

## File Structure
- `/app` — Next.js app directory (UI, API routes, favicon)
  - `/api/parse/route.js` — API endpoint for event extraction (integrates Gemini API)
  - `/page.js` — Main UI page
  - `/globals.css` — Custom CSS
  - `/layout.js` — Root layout and favicon
  - `/favicon.svg` — Calendar icon favicon (from Figma MCP server)
- `/public` — Static assets (favicon, fonts)
- `/tests` — Pytest unit tests for event extraction logic
- `README.md`, `PLANNING.md`, `TASK.md` — Documentation

## API Setup & Usage
- This app uses the Google Gemini API for event extraction.
- You must provide your own Gemini API key (see above).
- No external server or backend is required—everything runs via Next.js API routes.
- All calendar links (Google, Outlook, ICS) are generated client-side and never leave your browser.

## UI & Design
- UI is based on pixel-perfect Figma designs (integrated via Figma MCP server)
- Minor code tweaks were made to achieve the desired output and match Figma reference
- Error and empty state handling for user feedback
- Calendar icon favicon for a professional look

## SEO & Metadata
- Full SEO metadata added: title, description, keywords, Open Graph, Twitter Card, canonical, favicon, theme color, accessibility tags.
- Project is privacy-first, AI-powered, supports Google/Outlook/ICS, and requires no login.

## Contributing & Feedback
If you have suggestions, bug reports, or want to contribute:
- Open an issue or pull request on GitHub
- Or reach out to [Shanmu](https://shanmus4.framer.website/)

## License
[MIT](LICENSE)

---

**Created and maintained by [Your Name].**
