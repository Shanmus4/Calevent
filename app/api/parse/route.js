import { NextResponse } from 'next/server'

// Helper: Generate Google Calendar link
function generateGoogleCalendarLink(event) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  const params = [
    `text=${encodeURIComponent(event.title)}`,
    `dates=${event.start.replace(/[-:]/g, '').replace(/\.\d+Z$/, '').replace('T', 'T').replace(/\+/g, 'Z')}/${event.end.replace(/[-:]/g, '').replace(/\.\d+Z$/, '').replace('T', 'T').replace(/\+/g, 'Z')}`,
    `details=${encodeURIComponent(event.description)}`,
    `location=${encodeURIComponent(event.location || '')}`
  ].join('&')
  return `${base}&${params}`
}

// Helper: Generate .ics file content
function generateICS(event) {
  return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nDTSTART:${event.start.replace(/[-:]/g, '').replace(/\.\d+Z$/, '').replace('T', 'T').replace(/\+/g, 'Z')}\nDTEND:${event.end.replace(/[-:]/g, '').replace(/\.\d+Z$/, '').replace('T', 'T').replace(/\+/g, 'Z')}\nLOCATION:${event.location || ''}\nEND:VEVENT\nEND:VCALENDAR`;
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
  const { text } = await req.json()
  // --- Gemini API Integration ---
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ events: [], error: 'Gemini API key not set.' }, { status: 500 })
  }

  // Prompt for Gemini
  // Universal prompt: Extract all actionable events from ANY kind of message (travel, meetings, reminders, social, etc). Use multi-line emoji-rich descriptions, include all important details, and handle timezones and relative dates. Provide a diverse example. Only output a JSON array.
  const now = new Date();
  const tz = process.env.LOCAL_TIMEZONE || 'Asia/Kolkata';
  const nowStr = now.toLocaleString('en-CA', { timeZone: tz, hour12: false }).replace(',', '');
  const prompt = `You are an expert calendar event extraction API. Your job is to analyze any user input (email, message, itinerary, invitation, or note) and extract every possible event that a user might want to add to their calendar.\n\nTODAY is ${nowStr} in timezone ${tz}.\n\nReturn a JSON array of events. Each event must be a JSON object with keys: title, description, start, end, location.\n\nGuidelines:\n- Extract all events, even if the input is noisy, long, or contains unrelated information.\n- Handle all event types: travel, reservations, meetings, appointments, reminders, classes, parties, flights, bills, etc.\n- Handle relative dates (\"tomorrow\", \"next Friday\", \"in 2 weeks\"), ambiguous times (\"noon\", \"evening\"), and missing years (assume the next occurrence).\n- Handle recurring events by either expanding them into individual events (for the next 6 weeks) or including a recurrence note in the description.\n- For events with partial information (missing date/time/location/title), fill in sensible defaults (e.g., use today, 1-hour duration, \"Event\" as title, or leave location empty).\n- If an event spans midnight, ensure the end date is the next day.\n- For multiple events, ensure each is a separate object in the array.\n- For events with links, attachments, phone numbers, email addresses, or other info, only include details in the description if they are genuinely useful for a human scheduling or attending the event (e.g., host contact, reservation code, directions, support numbers). Avoid copying generic or automated sender emails, marketing text, legal disclaimers, or irrelevant info.\n- Use human-friendly, clear, and concise sentences for the description, summarizing only the most important and actionable information (host, contact, reservation code, guests, amount, house rules, etc.).\n- Format the description in clear, multi-line format, using emojis where appropriate (e.g., 🏠 for address, 📞 for phone, 👤 for host, 💳 for amount, 🏷️ for reservation code, 🐾 for pets, 🔑 for self check-in, 👥 for guests, 📅 for date/time, etc.).\n- Each line in the description should start with an emoji and summarize a key point.\n- Make the description simple and easy for a user to understand at a glance.\n- Use ISO 8601 datetime strings for 'start' and 'end'.\n- If no end time, set end = start + 1 hour.\n- If no title, use a generic title like \"Meeting\" or \"Event\".\n- DO NOT include any explanation, markdown, or text outside the JSON array.\n- Example:\n[\n  {\"title\": \"Team Meeting\", \"description\": \"👥 Attendees: Alice, Bob, Carol\\n📅 Date/Time: 2025-04-30 10:00 AM\\n🏢 Location: Conference Room 2\\n📝 Agenda: Q2 Planning\\n📞 Dial-in: +1-555-123-4567\", \"start\": \"2025-04-30T10:00:00\", \"end\": \"2025-04-30T11:00:00\", \"location\": \"Conference Room 2\"},\n  {\"title\": \"Doctor Appointment\", \"description\": \"👤 Doctor: Dr. Smith\\n🏥 Clinic: City Health Center\\n📅 Date/Time: 2025-05-02 15:30\\n📞 Contact: +1-555-987-6543\", \"start\": \"2025-05-02T15:30:00\", \"end\": \"2025-05-02T16:30:00\", \"location\": \"City Health Center\"},\n  {\"title\": \"Flight to NYC\", \"description\": \"✈️ Airline: AirX\\n🔢 Flight: AX123\\n🛫 Departure: 2025-05-05 08:00\\n🛬 Arrival: 2025-05-05 11:00\\n🏠 From: SFO Airport\\n🏠 To: JFK Airport\\n🏷️ Booking: ZXCV1234\", \"start\": \"2025-05-05T08:00:00\", \"end\": \"2025-05-05T11:00:00\", \"location\": \"SFO Airport\"},\n  {\"title\": \"Birthday Party\", \"description\": \"🎉 Host: Jane\\n🏠 Address: 123 Main St, Springfield\\n📅 Date/Time: 2025-05-10 19:00\\n🎂 RSVP: +1-555-222-3333\", \"start\": \"2025-05-10T19:00:00\", \"end\": \"2025-05-10T22:00:00\", \"location\": \"123 Main St, Springfield\"}\n]\n\nEmail or message:\n${text.trim()}`;

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
    jsonString = gemini.candidates?.[0]?.content?.parts?.[0]?.text || ''
    // Remove markdown, explanations, etc.
    const match = jsonString.match(/\[.*\]/s)
    if (!match) throw new Error('No JSON array found')
    const events = JSON.parse(match[0])
    // Add calendar links
    const eventsWithLinks = events.map(event => ({
      ...event,
      google_link: generateGoogleCalendarLink(event),
      outlook_link: generateOutlookCalendarLink(event),
      ics_link: `data:text/calendar;charset=utf-8,${encodeURIComponent(generateICS(event))}`
    }))
    return NextResponse.json({ events: eventsWithLinks })
  } catch (e) {
    return NextResponse.json({ events: [], error: 'Failed to parse Gemini response', raw: jsonString }, { status: 500 })
  }
}
