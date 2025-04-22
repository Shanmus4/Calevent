# TASK.md

## Active Tasks
- [ ] Add error handling and edge case handling
- [ ] Add support for more calendar platforms
- [ ] Improve accessibility and mobile UX
- [ ] Add privacy statement to UI
- [ ] Add fallback PNG/ICO favicon for maximum browser compatibility
- [ ] Add loading state for event parsing
- [ ] Add keyboard navigation for dropdown

## Completed Tasks
- [x] Next.js project setup with custom CSS
- [x] Created main UI page and event extraction form
- [x] Implemented Gemini API integration for event parsing
- [x] Added Google Calendar and .ics file generation
- [x] Added Outlook Calendar link generation
- [x] Multi-line, emoji-rich event descriptions
- [x] Privacy-first: no login, no data stored
- [x] Environment variable/config documentation
- [x] Unit tests for event extraction logic
- [x] Refined Gemini API prompt for robust event extraction
- [x] Integrated Figma MCP server for UI review and pixel-perfect design reference
- [x] Implemented calendar type dropdown with smooth animation, width sync, and icon display
- [x] Added event details textarea and main action button section
- [x] Added result section with dynamic event title and calendar action button
- [x] Added error state UI for missing event details
- [x] Added favicon (calendar icon)
- [x] Minor code tweaks for design accuracy based on Figma feedback
- [x] Polish UI and accessibility (Figma MCP server integration)
- [x] Update Gemini AI prompt to generate more descriptive event titles (e.g., include room/property name for bookings, airline/flight number for flights, etc.) (2025-04-22 16:07)
- [x] Ensure dropdown and result button UI improvements: icon fixes, shorter labels, correct .ics label (2025-04-22 16:07)
- [x] Refactor CSS for scroll/overflow and scale (2025-04-22 16:07)
- [x] Improve responsiveness: body padding and section paddings adjust for screens <640px (2025-04-22 16:29)
- [x] Vertically center main title and scale main frame for compactness (2025-04-22 16:29)
- [x] Add margin and centering to footer note (2025-04-22 16:29)

## Discovered During Work
- [ ] Add more prompt examples for edge-case event types (future)

## Safety & Privacy Checklist
- [x] .env and all secrets are gitignored
- [x] No API keys or sensitive data in repo
- [x] No user data stored or logged
- [x] All calendar links generated client-side
