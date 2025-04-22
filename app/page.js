"use client";
import { useState } from 'react'

export default function Home() {
  const [input, setInput] = useState('')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [raw, setRaw] = useState('')

  async function handleParse() {
    setLoading(true)
    setError('')
    setEvents([])
    setRaw('')
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Parsing failed')
      setEvents(data.events)
      setRaw(data.raw)
    } catch (err) {
      setError(err.message)
      setRaw(err.raw)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="main-container">
      <h1>Calendar Event Generator</h1>
      <label htmlFor="event-input">Paste your email or event details:</label>
      <textarea
        id="event-input"
        rows={6}
        placeholder="Paste your email or event details here..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button onClick={handleParse} disabled={loading || !input.trim()}>
        {loading ? 'Parsing…' : 'Extract Events'}
      </button>
      {error && (
        <div className="error">
          {error}
          {raw && (
            <details className="mt-2"><summary>Raw Gemini Output</summary><pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">{raw}</pre></details>
          )}
        </div>
      )}
      <div>
        {events.length > 0 && <h2 className="font-semibold mb-2">Events:</h2>}
        {events.map((evt, i) => (
          <div key={i} className="event-card">
            <div className="event-title">{evt.title}</div>
            <div className="event-details">{evt.description}</div>
            <div className="event-details">{evt.start} — {evt.end}</div>
            <div className="event-details">{evt.location}</div>
            <div className="event-links">
              {evt.google_link && <a href={evt.google_link} target="_blank" rel="noopener noreferrer">Google Calendar</a>}
              {evt.outlook_link && <a href={evt.outlook_link} target="_blank" rel="noopener noreferrer" style={{marginLeft:8}}>Outlook Calendar</a>}
              {evt.ics_link && <a href={evt.ics_link} download={`event-${i+1}.ics`} style={{marginLeft:8}}>.ics</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
