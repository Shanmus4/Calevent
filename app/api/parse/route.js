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
  console.log('[calevents] Backend received timezone:', timezone, 'Using tz:', tz);
  const now = new Date();
  const nowStr = now.toLocaleString('en-CA', { timeZone: tz, hour12: false }).replace(',', '');
  console.log('[calevents] Backend nowStr for prompt:', nowStr);
  const prompt = `You are an expert event extraction API for calendar tools. Your job is to analyze any user input—especially pasted booking details, tickets, itineraries, or schedules—and extract every possible event a user might want to add to their calendar.\n\nTODAY is ${nowStr} in timezone ${tz}.\n\nReturn a JSON array of events. Each event must be a JSON object with keys: title, description, start, end, location.\n\nInstructions:\n- First, identify what kind of document or text the user has pasted. Is it a train ticket, flight ticket, hotel booking, itinerary, meeting schedule, or something else? Use clues from the text to determine the context.\n- Tailor the event extraction and formatting to the identified context:\n  - For train tickets: include PNR, train number/name, passenger name(s), seat/berth, coach, boarding/departure/arrival stations and times, total fare, support contacts, and any other important info.\n  - For flight tickets: include PNR, airline, flight number, passenger name(s), seat, departure/arrival airports and times, gate, terminal, booking code, support contacts, baggage allowance, total fare, etc.\n  - For hotel bookings: include hotel name, address, check-in/check-out times, room type, reservation code, guest name(s), support contacts, breakfast/meals included, total amount, etc.\n  - For itineraries or schedules: extract all relevant events, with individual details for each.\n  - For meetings: include organizer, agenda, participants, location/URL, and any codes or instructions.\n  - For any other type: extract every detail that could be useful to the user.\n- For the event description, be extremely thorough and organized:\n  - Carefully extract and include every important detail from the input, especially when the input is long or copied from a ticket, PDF, or itinerary.\n  - Double-check that you have not missed any key information (such as phone, host, reservation code, address, amount, rules, instructions, seat, gate, timings, etc).\n  - Each line should contain: an emoji, a heading (e.g., Phone, Host, Reservation Code), and the content/value.\n  - Each line should be separated by a blank line for visual spacing.\n  - Put the most important information first (e.g., phone, PNR, reservation code, host name, etc).\n  - Example line: 📞 Phone: +91 12345 67890\n    (then a blank line)\n    🏷️ Reservation Code: HM8PJKC9MZ\n    (then a blank line)\n    👤 Host: Akshay\n  - Use human-friendly, concise headings for each line.\n- For the event title: Make it concise but informative, using the type and key details (e.g., \"Train 12345 Chennai Exp - Boarding\", \"Flight AI302 to Delhi\", \"Hotel Check-in: Taj Palace\", \"Team Meeting with Akshay\").\n- If information is missing, fill in sensible defaults (e.g., 1-hour duration, generic title, empty location).\n- Use ISO 8601 datetime strings for 'start' and 'end', and always include the timezone offset (e.g., 2025-04-23T13:00:00+05:30).\n- If the user includes a timezone, use it as the event timezone.\n- If no timezone is specified and the event is something local (like a lunch appointment), use the user's calendar default timezone.\n- If the event is a flight or hotel booking, infer the timezone from the airport or hotel location information if possible.\n- If no end time, set end = start + 1 hour.\n- If no title, use a generic title like \"Event\".\n- For ambiguous or incomplete times (e.g., \"at 8\", \"at 9\", \"at 7:30\", \"at noon\"), always infer the user's most likely intent based on the current local time (${nowStr}) and day. Use the following logic:\n  - If the event refers to a past time (e.g., 'yesterday', 'last week', or a date before today), always schedule the event for that past date and time.\n  - If the event is a meal (e.g., breakfast, lunch, dinner) and the specified time has already passed today, schedule the event for tomorrow at that time.\n  - If the event is an activity (e.g., football, meeting, call):\n    - If the specified time is still in the future today (i.e., later than the current time), schedule the event for today at that time.\n    - If the specified time has already passed today, schedule the event for tomorrow at that time.\n  - If the user writes \"today\" explicitly (e.g., \"football at 8 today\"), always schedule the event for today at that time, even if it is in the future today.\n  - If AM/PM is ambiguous, use context and common sense (e.g., \"at 8\" for football in the evening is likely 8 PM, \"at 7\" for breakfast is likely 7 AM).\n  - Always prefer the next logical occurrence of the time, and apply this logic to all ambiguous times.\n- DO NOT include any explanation, markdown, or text outside the JSON array.\n- Example:\n[\n  {\n    \"title\": \"Train 12345 Chennai Exp - Boarding\",\n    \"description\": \"🏷️ PNR: HM8PJKC9MZ\\n\\n🚆 Train: 12345 Chennai Express\\n\\n🧑 Passenger: Akshay\\n\\n🪑 Seat: S3-45 (Lower Berth)\\n\\n🚉 Boarding: Chennai Central at 18:00\\n\\n📞 Support: 1800-123-4567\\n\\n💵 Fare: ₹1200\",\n    \"start\": \"2025-04-27T18:00:00+05:30\",\n    \"end\": \"2025-04-27T20:30:00+05:30\",\n    \"location\": \"Chennai Central\"\n  }\n]\n\nEmail or message:\n${text.trim()}`;

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
        ics_link: `/api/ics/${encodeURIComponent(event.title || 'event')}?${icsParams}`
      };
    });
    return NextResponse.json({ events: eventsWithLinks })
  } catch (e) {
    return NextResponse.json({ events: [], error: 'Cannot extract events from your input' }, { status: 200 })
  }
}
