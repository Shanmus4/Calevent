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
  const { text, timezone } = await req.json()
  // --- Gemini API Integration ---
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ events: [], error: 'Gemini API key not set.' }, { status: 500 })
  }

  // Use the user's timezone if provided, else fallback
  const tz = timezone || process.env.LOCAL_TIMEZONE || 'Asia/Kolkata';
  const now = new Date();
  const nowStr = now.toLocaleString('en-CA', { timeZone: tz, hour12: false }).replace(',', '');
  const prompt = `You are an expert calendar event extraction API. Your job is to analyze any user input (email, message, itinerary, invitation, or note) and extract every possible event that a user might want to add to their calendar.\n\nTODAY is ${nowStr} in timezone ${tz}.\n\nReturn a JSON array of events. Each event must be a JSON object with keys: title, description, start, end, location.\n\nGuidelines:\n- Extract every date and time span that could represent an actionable event for a user, no matter how many are present in the text.\n- If the text contains multiple dates, times, check-ins, check-outs, appointments, or any other time-based actions, create a separate event for each one.\n- Do not assume there will only be two events; extract as many as are relevant, even if there are three, four, or more.\n- Each event should have a clear, descriptive title and the correct start and end times.\n- Make titles a little more descriptive, but not too verbose. For example, if it's a room booking, include the room or property name in the title. If it's a flight, mention the airline or flight number.\n- For the event description, use the following format for each key detail (such as phone, host, reservation code, address, amount, rules, etc):\n  - Each line should contain: an emoji, a heading (e.g., Phone, Host, Reservation Code), and the content/value.\n  - Each line should be separated by a blank line for visual spacing.\n  - Put the most important information first (e.g., phone, PNR, reservation code, host name, etc).\n  - Example line: 📞 Phone: +91 12345 67890\n    (then a blank line)\n    🏷️ Reservation Code: HM8PJKC9MZ\n    (then a blank line)\n    👤 Host: Akshay\n- Use human-friendly, concise headings for each line.\n- If information is missing, fill in sensible defaults (e.g., 1-hour duration, generic title, empty location).\n- Use ISO 8601 datetime strings for 'start' and 'end'.\n- If the user includes a timezone, use it as the event timezone.\n- If no timezone is specified and the event is something local (like a lunch appointment), use the user's calendar default timezone.\n- If the event is a flight or hotel booking, infer the timezone from the airport or hotel location information if possible.\n- If no end time, set end = start + 1 hour.\n- If no title, use a generic title like \"Event\".\n- For ambiguous or incomplete times (e.g., \"at 8\", \"at 9\", \"at 7:30\", \"at noon\"), always infer the user's most likely intent based on the current local time (${nowStr}) and day:\n  - If the specified time is still in the future today, schedule the event for today at that time.\n  - If the specified time has already passed today, schedule the event for tomorrow at that time.\n  - If AM/PM is ambiguous, use common sense (e.g., \"at 8\" in the evening is likely 8 PM, \"at 7\" in the morning is likely 7 AM).\n  - Always prefer the next logical occurrence of the time, and apply this logic to all ambiguous times.\n- DO NOT include any explanation, markdown, or text outside the JSON array.\n- Example:\n[\n  {\"title\": \"Dinner with Friends\", \"description\": \"📞 Phone: +91 12345 67890\\n\\n🏷️ Reservation Code: HM8PJKC9MZ\\n\\n👤 Host: Akshay\\n\\n🏠 Address: 123 Main St, Springfield\", \"start\": \"2025-04-27T20:00:00\", \"end\": \"2025-04-27T22:00:00\", \"location\": \"123 Main St, Springfield\"}\n]\n\nEmail or message:\n${text.trim()}`;

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
    if (!Array.isArray(events) || events.length === 0) {
      // No events extracted, treat as gibberish or no actionable info
      return NextResponse.json({ events: [], error: 'Cannot extract events from your input' }, { status: 200 })
    }
    // Add calendar links
    const eventsWithLinks = events.map(event => ({
      ...event,
      google_link: generateGoogleCalendarLink(event),
      outlook_link: generateOutlookCalendarLink(event),
      ics_link: `data:text/calendar;charset=utf-8,${encodeURIComponent(generateICS(event))}`
    }))
    return NextResponse.json({ events: eventsWithLinks })
  } catch (e) {
    return NextResponse.json({ events: [], error: 'Cannot extract events from your input' }, { status: 200 })
  }
}
