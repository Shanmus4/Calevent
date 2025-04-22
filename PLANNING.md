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

## User Flow
1. User pastes event or email text
2. Clicks 'Extract Events'
3. Next.js API route calls Gemini, parses events
4. UI displays all extracted events, calendar links, and .ics downloads

## File Structure
- `/app` — Next.js app directory
  - `page.js` — Main UI
  - `api/parse/route.js` — API endpoint for event parsing
  - `globals.css` — Custom CSS
- `/tests` — Pytest unit tests for event extraction
- `README.md`, `PLANNING.md`, `TASK.md` — Docs

## Initial Feature List
- [x] Next.js project setup with custom CSS
- [x] API route for event extraction
- [x] Google Calendar, Outlook, and .ics link generation
- [x] Multi-line, emoji-rich event descriptions
- [x] Privacy-first: no data stored, no login
- [x] Responsive, minimal UI
- [x] Environment variable/config documentation
- [x] Unit tests for event extraction

## Safety & Privacy
- All environment variables and secrets are stored in `.env.local` and never committed.
- No user data is stored or tracked anywhere in the app.
- All event extraction happens via the Gemini API and is not retained.
- All calendar links are generated client-side for maximum privacy.

## Stretch Goals
- [ ] Advanced recurrence and edge case handling
- [ ] UI polish and accessibility improvements (Figma MCP server integration)
- [ ] Mobile-first enhancements

## Notes
- All code is original and maintained by me.
- No user data is stored; privacy is a core feature.
