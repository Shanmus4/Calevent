import { NextResponse } from 'next/server';

// Helper: Format date as UTC for ICS (YYYYMMDDTHHMMSSZ)
function formatDateUTCforICS(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z');
}

// Helper: Generate .ics file content
function generateICS(event) {
  return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nDTSTART:${formatDateUTCforICS(event.start)}\nDTEND:${formatDateUTCforICS(event.end)}\nLOCATION:${event.location || ''}\nEND:VEVENT\nEND:VCALENDAR`;
}

// GET /api/ics/[eventId]?title=...&description=...&start=...&end=...&location=...
export async function GET(req, { params }) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Event';
  const description = searchParams.get('description') || '';
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const location = searchParams.get('location') || '';
  if (!start || !end) {
    return new NextResponse('Missing start or end time', { status: 400 });
  }
  const event = { title, description, start, end, location };
  const icsContent = generateICS(event);
  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename=event.ics`,
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
