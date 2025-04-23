import { NextResponse } from 'next/server'

// Helper: Format date as UTC for Google Calendar (YYYYMMDDTHHMMSSZ)
function formatDateUTC(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z').replace('T', 'T');
}

// Helper: Generate Google Calendar link
function generateGoogleCalendarLink(event) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  const params = [
    `text=${encodeURIComponent(event.title)}`,
    `dates=${formatDateUTC(event.start)}/${formatDateUTC(event.end)}`,
    `details=${encodeURIComponent(event.description)}`,
    `location=${encodeURIComponent(event.location || '')}`
  ].join('&')
  return `${base}&${params}`
}

// Helper: Format date as UTC for ICS (YYYYMMDDTHHMMSSZ)
function formatDateUTCforICS(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z');
}

// Helper: Generate .ics file content
function generateICS(event) {
  return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nDTSTART:${formatDateUTCforICS(event.start)}\nDTEND:${formatDateUTCforICS(event.end)}\nLOCATION:${event.location || ''}\nEND:VEVENT\nEND:VCALENDAR`;
}

// Helper: Format date as local time for Outlook Calendar (YYYY-MM-DDTHH:mm:ss)
function formatDateLocalForOutlook(dateStr) {
  const date = new Date(dateStr);
  return date.getFullYear() +
    '-' + String(date.getMonth() + 1).padStart(2, '0') +
    '-' + String(date.getDate()).padStart(2, '0') +
    'T' + String(date.getHours()).padStart(2, '0') +
    ':' + String(date.getMinutes()).padStart(2, '0') +
    ':' + String(date.getSeconds()).padStart(2, '0');
}

// Helper: Generate Outlook Calendar link (local time, no timezone)
function generateOutlookCalendarLinkLocal(event) {
  const base = 'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent';
  const params = [
    `subject=${encodeURIComponent(event.title)}`,
    `body=${encodeURIComponent(event.description)}`,
    `startdt=${encodeURIComponent(formatDateLocalForOutlook(event.start))}`,
    `enddt=${encodeURIComponent(formatDateLocalForOutlook(event.end))}`,
    `location=${encodeURIComponent(event.location || '')}`
  ].join('&');
  return `${base}&${params}`;
}

// Helper: Generate Outlook Calendar link
function generateOutlookCalendarLink(event) {
  const base = 'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent';
  const params = [
    `subject=${encodeURIComponent(event.title)}`,
    `body=${encodeURIComponent(event.description)}`,
    `startdt=${encodeURIComponent(event.start)}`,
    `enddt=${encodeURIComponent(event.end)}`,
    `location=${encodeURIComponent(event.location || '')}`
  ].join('&');
  return `${base}&${params}`;
}

export async function POST(req) {
  const { text, timezone, currentTime } = await req.json()
  // --- Gemini API Integration ---
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ events: [], error: 'Gemini API key not set.' }, { status: 500 })
  }

  // Use the user's timezone if provided, else fallback
  const tz = timezone || process.env.LOCAL_TIMEZONE || 'Asia/Kolkata';
  // Use the user's local time if provided, else fallback to server time
  const now = currentTime ? new Date(currentTime) : new Date();
  const nowStr = now.toLocaleString('en-CA', { timeZone: tz, hour12: false }).replace(',', '');
  console.log('[calevents] Backend nowStr for prompt:', nowStr);
  const prompt = `You are the world's best calendar event extraction AI. CURRENT DATETIME: ${nowStr}
USER TIMEZONE: ${tz}

---

Your job:
- Read the user's input (see USER INPUT at the end).
- **It is VERY IMPORTANT that you carefully extract and include EVERY piece of important information from the input in the event description.**
- Important information includes (but is not limited to): reservation codes, ticket numbers, addresses, phone numbers, participants, agenda items, support contacts, confirmation numbers, and any unique details present in the input.
- For each event, the description must list ALL such details, each on a separate line, each line starting with a relevant emoji and separated by a blank line (double newline).
- Output a strict JSON array of event objects (see Output Format).
- It is important that you UNDERSTAND what the event is before you create JSON array. Since every input is unique, you need to have a clear understanding of what the event in order to produce the best results for the user. 

---

Output Format (MUST work on iOS/Apple Calendar, Google Calendar, Outlook):
[
  {
    "title": "string, concise, context-specific",
    "description": "string, with ALL important details from the input. Each line must start with a relevant emoji and be separated by a blank line (double newline).",
    "start": "ISO 8601 datetime string WITH timezone offset (e.g. 2025-04-24T14:00:00+05:30)",
    "end": "ISO 8601 datetime string WITH timezone offset (if missing, set end = start + 1 hour)",
    "location": "string, as detailed as possible"
  }
]

---

IMPORTANT RULES:
- **It is CRUCIAL that the description field contains ALL important information from the input, not just the event summary.**
- Important information includes: reservation codes, ticket numbers, addresses, phone numbers, participants, agenda, support contacts, confirmation numbers, and any other unique or relevant details.
- Each line in the description must begin with a relevant emoji (e.g., 📅, 🏠, ✈️, 👤, 🕒, etc.)
- Each line in the description must be separated by a blank line (double newline, for extra spacing between lines).
- Always use the CURRENT DATETIME and USER TIMEZONE above as the reference for interpreting relative dates like 'tomorrow', 'next Monday', etc.
- If the user enters a date in the past (e.g., yesterday), create the event for the most recent occurrence, but warn if the event is in the past.
- If the user uses words like 'at 8', 'at 9', 'breakfast at 8', assume AM for breakfast/morning events, PM for evening/late events (use context and common sense).
- If the user enters gibberish or input with no valid date/time, return an error: "No events extracted." However, if the input is a simple meal, reminder, or meeting with a time, always extract it as an event.
- Support expressions like '10 days from now', 'tomorrow', '2 days from yesterday', and resolve them using CURRENT DATETIME.
- Never guess the year/month/day; always use the current date as the base for all relative or incomplete dates.
- If any info is missing, fill with sensible defaults (e.g., end = start + 1 hour, location = "(none)").
- Output ONLY a valid JSON array of event objects. DO NOT include any explanations, markdown, or extra text. Your response must be parseable as JSON.
- For iOS compatibility, all datetime strings must include timezone offset (never just 'Z').
- For multi-day bookings (e.g., hotels), create two events: one for check-in, one for check-out.
- For journeys (bus, train, flight): a single event from start to end time is appropriate  if journey duration is within 6 hours. If it is greater than 6 hours, create just one event of default setting of 1 hour duration.
- For bookings with check-in/check-out: separate events for each.
- For recurring events, create only the first instance unless recurrence is explicitly requested.
- If the input describes multiple events, extract each one separately.
- NEVER include explanations, markdown, or extra text—output ONLY the JSON array.

---

VERY IMPORTANT TIMEZONE RULE:
- If user includes a timezone, it will be respected in the invite. If no timezone is specified and the event is something local (like a lunch appointment), the user's default timezone will be used. However, if the event is a flight or hotel booking, the airport/hotel information will be used to infer the timezone. This is very important for accurate calendar invites.

---

EDGE CASES & EXAMPLES:
1. Meeting:
[
  {
    "title": "Lunch Meeting",
    "description": "🍽️ Lunch with team\n\n👤 Attendees: Akshay, Priya\n\n📍 Cafe Coffee Day, Mumbai",
    "start": "2025-04-24T14:00:00+05:30",
    "end": "2025-04-24T15:00:00+05:30",
    "location": "Cafe Coffee Day, Mumbai"
  }
]

2. Hotel Booking:
[
  {
    "title": "Hotel Check-in: Taj Palace",
    "description": "🏷️ Reservation Code: HM8PJKC9MZ\n\n👤 Guest: Akshay\n\n📍 Address: Taj Palace, Mumbai\n\n📞 Support: 1800-123-4567",
    "start": "2025-04-27T14:00:00+05:30",
    "end": "2025-04-27T15:00:00+05:30",
    "location": "Taj Palace, Mumbai"
  },
  {
    "title": "Hotel Check-out: Taj Palace",
    "description": "🏷️ Reservation Code: HM8PJKC9MZ\n\n👤 Guest: Akshay\n\n📍 Address: Taj Palace, Mumbai\n\n📞 Support: 1800-123-4567",
    "start": "2025-04-29T11:00:00+05:30",
    "end": "2025-04-29T12:00:00+05:30",
    "location": "Taj Palace, Mumbai"
  }
]

3. Flight:
[
  {
    "title": "Flight: Mumbai to Goa",
    "description": "✈️ Flight: Indigo 6E-1234\n\n🛫 Departure: Mumbai Airport\n\n🛬 Arrival: Goa Airport\n\n👤 Passenger: Akshay\n\n🏷️ Ticket: IND123456",
    "start": "2025-04-27T08:00:00+05:30",
    "end": "2025-04-27T10:00:00+05:30",
    "location": "Mumbai Airport to Goa Airport"
  }
]

4. Movie:
[
  {
    "title": "Movie: Avengers Endgame",
    "description": "🎬 Movie: Avengers Endgame\n\n📍 PVR Cinemas, Mumbai\n\n🕒 Showtime: 7:00 PM",
    "start": "2025-04-24T19:00:00+05:30",
    "end": "2025-04-24T22:00:00+05:30",
    "location": "PVR Cinemas, Mumbai"
  }
]

---

At the end of every description, append this exact line (after a blank line):
"------\nEvent created by https://calevents.vercel.app "
This is required for every event description.

---

USER INPUT:
${text.trim()}

IMPORTANT: Output ONLY a valid JSON array of event objects. DO NOT include any explanations, markdown, or extra text. Your response must be parseable as JSON.`;

  // Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  )
  if (!response.ok) {
    return NextResponse.json({ events: [], error: 'Gemini API error' }, { status: 500 })
  }
  const gemini = await response.json()
  let jsonString = ''
  try {
    jsonString = gemini.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[calevents][DEBUG] Raw Gemini output:', JSON.stringify(jsonString));
    // Remove Markdown code fences if present
    jsonString = jsonString.replace(/```json|```/gi, '').trim();
    // Sanitize: Replace unescaped control characters only inside string values
    jsonString = jsonString.replace(/"((?:[^"\\]|\\.)*)"/g, (match, p1) => {
      const fixed = p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      return `"${fixed}"`;
    });
    let events;
    try {
      // Try direct JSON parse first
      events = JSON.parse(jsonString);
    } catch (e) {
      console.error('[calevents][ERROR] JSON parse failed:', e, 'Input:', jsonString);
      return NextResponse.json({ events: [], error: `Parse error: ${e.message}`, gemini_raw: jsonString }, { status: 200 });
    }
    // If it's a single event object, wrap in array
    if (!Array.isArray(events)) {
      events = [events];
    }
    if (events.length === 0) {
      // No events extracted, treat as gibberish or no actionable info
      return NextResponse.json({ events: [], error: 'No events extracted from your input', gemini_raw: jsonString }, { status: 200 })
    }
    // Add calendar links
    const eventsWithLinks = events.map(event => {
      // Construct server-based .ics link
      const icsParams = new URLSearchParams({
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location || ''
      }).toString();
      return {
        ...event,
        google_link: generateGoogleCalendarLink(event),
        outlook_link: generateOutlookCalendarLink(event),
        outlook_link_local: generateOutlookCalendarLinkLocal(event),
        ics_link: `/api/ics/${encodeURIComponent(event.title || 'event')}?${icsParams}`
      };
    });
    return NextResponse.json({ events: eventsWithLinks, gemini_raw: jsonString })
  } catch (e) {
    return NextResponse.json({ events: [], error: 'Cannot extract events from your input', gemini_raw: jsonString }, { status: 200 })
  }
}