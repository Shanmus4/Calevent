# Calendar Event Generator — Project Requirements & Planning

## Project Vision
Build a privacy-first web app that lets users extract calendar events from any pasted text (emails, messages, itineraries, reminders, etc.) and generate Google Calendar, Outlook Calendar, and .ics links for easy import into any calendar system.

## Core Requirements
- Paste any text to extract actionable events (supporting all event types: meetings, travel, reminders, appointments, parties, bills, etc.)
- Support multi-event extraction from a single input
- Generate Google Calendar, Outlook Calendar, and .ics links for each event
- Use multi-line, emoji-rich event descriptions for clarity
- No user authentication, no data storage (privacy by design)
- Minimal, responsive UI using Next.js and custom CSS
- All logic in JavaScript/React/Next.js; no backend server or database
- API integration for event extraction (Google Gemini)

## Architecture
- **Frontend & API:** Next.js (React, custom CSS, app directory)
- **Event Parsing:** Gemini API (integrated in `/app/api/parse/route.js`)
- **Calendar Links:** Google, Outlook, and .ics links generated on the fly
- **No persistent backend or database**
- **UI Design Reference:** Figma MCP server used for pixel-perfect UI implementation

## User Flow
1. User pastes event or email text
2. Clicks 'Create Invites'
3. Next.js API route calls Gemini, parses events
4. UI displays all extracted events, calendar links, and .ics downloads

## File Structure
- `/app` — Next.js app directory
  - `page.js` — Main UI
  - `api/parse/route.js` — API endpoint for event parsing
  - `globals.css` — Custom CSS
  - `layout.js` — Root layout and favicon
  - `favicon.svg` — Calendar icon favicon (from Figma MCP server reference)
- `/public` — Static assets (favicon, fonts)
- `/tests` — Pytest unit tests for event extraction
- `README.md`, `PLANNING.md`, `TASK.md` — Docs

## Feature List
- [x] Next.js project setup with custom CSS
- [x] API route for event extraction
- [x] Google Calendar, Outlook, and .ics link generation
- [x] Multi-line, emoji-rich event descriptions
- [x] Privacy-first: no data stored, no login
- [x] Responsive, minimal UI
- [x] Environment variable/config documentation
- [x] Unit tests for event extraction
- [x] Figma MCP server integration for UI reference
- [x] Calendar type dropdown with icons, animation, and width sync
- [x] Error state UI for missing event details
- [x] Favicon (calendar icon)
- [x] Minor code tweaks for design accuracy
- [x] SEO optimization for better discoverability (meta tags, Open Graph, accessibility, etc.)
- [x] Gemini Vision API integration for image-to-text extraction via drag-and-drop/file upload
- [x] MIME type inference and robust error handling for uploads
- [x] ICS download: always triggers file download, not browser open
- [x] Security review: all secrets in .env.local, no user data stored, no analytics

## Safety & Privacy
- All environment variables and secrets are stored in `.env.local` and never committed.
- No user data is stored or tracked anywhere in the app.
- All event extraction happens via the Gemini API and is not retained.
- All calendar links are generated client-side for maximum privacy.
- ICS downloads use Content-Disposition: attachment and frontend download attribute to force download.
- Image uploads are processed in-memory and deleted after use.
- **No geolocation, camera, or microphone permissions are ever requested.**
- **Timezone is detected only via browser settings (Intl API); no location/device permissions needed.**

## Stretch Goals
- [ ] Advanced recurrence and edge case handling
- [ ] UI polish and accessibility improvements (Figma MCP server integration)
- [ ] Mobile-first enhancements
- [ ] Add fallback PNG/ICO favicon for maximum browser compatibility
- [ ] Add loading state for event parsing
- [ ] Add keyboard navigation for dropdown

## Recent Changes
### [2025-04-22]
- Gemini AI prompt now generates more descriptive event titles (room/property/flight etc. in title where possible)
- Dropdown UI: correct icons, shorter button labels, .ics label clarified
- CSS: improved scroll/overflow handling, consistent scaling
- Integrated Gemini Vision API for drag-and-drop image-to-text extraction
- ICS download always triggers download, not browser open
- Security audit: verified no sensitive data is exposed, all secrets in .env, no user data stored

#### Prompt Design
- Titles are concise but include key info (e.g., room name, airline)
- Descriptions are emoji+heading+content, spaced, with priority info first
- Timezone logic: user-specified > inferred from context > default

#### UI/UX
- UI/UX finalized
- Ready for deployment

## Next Steps
- [ ] Deploy live (Vercel/Netlify recommended for Next.js)

## Deployment Readiness
- All unused packages removed
- UI/UX finalized
- Ready for deployment

## Notes
- All code is original and maintained by me.
- Ready for public repo: No secrets, no user data, no analytics, all dependencies up to date.
- See README.md for setup and security notes.
