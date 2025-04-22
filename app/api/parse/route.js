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
  const prompt = `You are an expert event extraction API for calendar tools. Your job is to analyze any user input—especially pasted booking details, tickets, itineraries, or schedules—and extract every possible event a user might want to add to their calendar.\n\nYour most important task is to read the user's input carefully, understand what kind of event(s) it describes, and tailor the extracted JSON events accordingly.\n\nDo NOT miss any important data. Different event types (flights, hotels, buses, trains, meetings, appointments, etc.) may require different extraction logic. Think deeply about the context and details before creating the JSON.\n\nWhen extracting start and end times for events, use logic that matches the real-world meaning of the event:\n- For journeys (bus, train, flight): a single event from start to end time is appropriate.\n- For bookings with a check-in and check-out (e.g., hotels, rooms): create two separate events—one for check-in, one for check-out—rather than a single multi-day event.\n- For any other case, use your best judgment to split or combine events so the calendar makes sense for the user.\n\nFor each event, include a notification field with the perfect reminder time for that event type. For example:\n- For flights: notification should be 3 or 4 hours before takeoff.\n- For hotel/room bookings: notification should be 30 minutes before check-in, and 1 hour before check-out.\n- For movies: notification should be 1 hour before start.\n- For exercise/workout: notification should be 5 minutes before.\n- For other event types, use your best judgment.\n\nIf the input describes multiple events, extract each one separately. For each event, include:\n- title: concise and context-specific\n- description: extremely thorough and organized, with all important details (emoji, heading, value per line, blank lines between)\n- start: ISO 8601 datetime string with timezone offset\n- end: ISO 8601 datetime string (if missing, set end = start + 1 hour)\n- location: as detailed as possible\n- notification: ISO 8601 datetime or relative offset (e.g., '3 hours before start')\n\nIf information is missing, fill in sensible defaults.\n\nNever include explanations or markdown—output ONLY the JSON array.\n\nExample:\n[\n  {\n    "title": "Bus: Mumbai to Goa",\n    "description": "🚌 Bus: RedBus 1234\\n\\n🛫 Departure: Mumbai Central\\n\\n🛬 Arrival: Goa Panjim\\n\\n🧑 Passenger: Akshay\\n\\n🏷️ Ticket: RBX123456",\n    "start": "2025-04-27T08:00:00+05:30",\n    "end": "2025-04-27T21:00:00+05:30",\n    "location": "Mumbai Central to Goa Panjim",\n    "notification": "1 hour before start"\n  },\n  {\n    "title": "Hotel Check-in: Taj Palace",\n    "description": "🏷️ Reservation Code: HM8PJKC9MZ\\n\\n👤 Guest: Akshay\\n\\n📍 Address: Taj Palace, Mumbai\\n\\n📞 Support: 1800-123-4567",\n    "start": "2025-04-27T14:00:00+05:30",\n    "end": "2025-04-27T15:00:00+05:30",\n    "location": "Taj Palace, Mumbai",\n    "notification": "30 minutes before start"\n  },\n  {\n    "title": "Hotel Check-out: Taj Palace",\n    "description": "🏷️ Reservation Code: HM8PJKC9MZ\\n\\n👤 Guest: Akshay\\n\\n📍 Address: Taj Palace, Mumbai\\n\\n📞 Support: 1800-123-4567",\n    "start": "2025-04-29T11:00:00+05:30",\n    "end": "2025-04-29T12:00:00+05:30",\n    "location": "Taj Palace, Mumbai",\n    "notification": "1 hour before start"\n  }\n]\n\nEmail or message:\n${text.trim()}`;

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
