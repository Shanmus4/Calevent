# Calendar Event Generator

A modern, privacy-first web app for extracting calendar events from your emails, messages, or notes and generating Google Calendar, Outlook Calendar, and .ics invite links.

## Features
- Paste any email or event text to extract one or multiple events
- Supports all event types: meetings, travel, reminders, appointments, parties, bills, and more
- Generates Google Calendar, Outlook Calendar links, and downloadable .ics files
- Multi-line, emoji-rich event descriptions for clarity and quick review
- Beautiful, minimal UI (custom CSS, Figma MCP server reference)
- No login, no data stored, 100% private
- Built with Next.js (React) for easy deployment and scalability


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

## Contributing & Feedback
If you have suggestions, bug reports, or want to contribute:
- Open an issue or pull request on GitHub
- Or reach out to [Shanmu](https://shanmus4.framer.website/)

## License
[MIT](LICENSE)

---

**Created and maintained by [Your Name].**
