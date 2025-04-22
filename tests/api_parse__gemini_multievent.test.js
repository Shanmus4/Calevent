import { POST } from '../app/api/parse/route'

const AIRBNB_EMAIL = `Reservation reminder - April 26, 2025
The Urban Escape - Pvt Duplex Studio
Apr 26–28
Check in
Sat, Apr 26
Check out
Mon, Apr 28
Duration of stay
2 nights
Address
GWRF+F23, New Kalyani Nagar, Vitthal Nagar, Digambar Nagar, Waterbay, Pune, Maharashtra 411014, India
Confirmation number
HM8PJKC9MZ
Message host+91 70666 52454`

describe('Gemini event extraction - multi-event, strict', () => {
  it('should extract check-in and check-out as separate events, ignore non-events', async () => {
    const req = { json: async () => ({ text: AIRBNB_EMAIL }) }
    const res = await POST(req)
    const { events, error } = await res.json()
    expect(error).toBeUndefined()
    expect(Array.isArray(events)).toBe(true)
    expect(events.length).toBeGreaterThanOrEqual(2)
    // Check-in event
    const checkin = events.find(e => /check.?in/i.test(e.title))
    expect(checkin).toBeTruthy()
    expect(checkin.description).toMatch(/🏠|📍|🔑/)
    expect(checkin.description.split('\n').length).toBeGreaterThan(1)
    // Check-out event
    const checkout = events.find(e => /check.?out/i.test(e.title))
    expect(checkout).toBeTruthy()
    // No non-events
    expect(events.some(e => /contact|message|call/i.test(e.title))).toBe(false)
  })
})
