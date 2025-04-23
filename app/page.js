"use client";
import { useState, useRef, useEffect } from "react";
import FileDropZone from "./components/FileDropZone";

// Main page with main-frame section, head, divider, calendar type, event details, button container (with main button), and footer note (with bold underlined links)
const CALENDAR_TYPES = [
  { label: "Google", value: "google" },
  { label: "Outlook", value: "outlook" },
  { label: ".ics File Download(iCalendar)", value: "ical" },
];

// Dummy event title and parse state for demo; replace with real logic as needed
const DEMO_EVENT_TITLE = "Team Sync Meeting";

export default function Home() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [calendarType, setCalendarType] = useState("google");
  const [results, setResults] = useState([]); // [{title, calendarType, link, ...}]
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const dropdownRef = useRef(null);
  const selectorRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        selectorRef.current &&
        !selectorRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // Ensure dropdown matches selector width
  useEffect(() => {
    if (dropdownRef.current && selectorRef.current) {
      dropdownRef.current.style.width = `${selectorRef.current.offsetWidth}px`;
    }
  }, [dropdownOpen]);

  // For smooth close after selection
  function handleSelect(type) {
    setCalendarType(type);
    setTimeout(() => setDropdownOpen(false), 120); // matches CSS transition
  }

  function getResultButtonText(type) {
    if (type === "google") return "Google Calendar";
    if (type === "outlook") return "Outlook";
    if (type === "ical") return "Download .ics";
    return "Calendar";
  }

  function getResultButtonIcon(type) {
    if (type === "ical") {
      return (
        <span className="result-section-btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 16.0001L7 11.0001L8.4 9.55012L11 12.1501V4.00012H13V12.1501L15.6 9.55012L17 11.0001L12 16.0001ZM6 20.0001C5.45 20.0001 4.97933 19.8045 4.588 19.4131C4.19667 19.0218 4.00067 18.5508 4 18.0001V15.0001H6V18.0001H18V15.0001H20V18.0001C20 18.5501 19.8043 19.0211 19.413 19.4131C19.0217 19.8051 18.5507 20.0008 18 20.0001H6Z" fill="#5C5C5C"/>
          </svg>
        </span>
      );
    }
    return (
      <span className="result-section-btn-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M10 4.00012H6C5.46957 4.00012 4.96086 4.21084 4.58579 4.58591C4.21071 4.96098 4 5.46969 4 6.00012V18.0001C4 18.5304 4.21071 19.0391 4.58579 19.4143C4.96086 19.7893 5.46957 20.0001 6 20.0001H18C18.5304 20.0001 19.0391 19.7893 19.4142 19.4143C19.7893 19.0391 20 18.5304 20 18.0001V14.0001M12 12.0001L20 4.00012M20 4.00012V9.00012M20 4.00012H15" stroke="#5C5C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }

  // Dropdown trigger icon (chevron)
  function DropdownChevronIcon() {
    return (
      <span className="calendar-type-dropdown-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M8.25 15.0001L12 18.7501L15.75 15.0001M8.25 9.00006L12 5.25006L15.75 9.00006" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }

  // Dropdown selected item icon (checkmark)
  function DropdownCheckIcon() {
    return (
      <span className="calendar-type-dropdown-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 7.00006L9 19.0001L3.5 13.5001L4.91 12.0901L9 16.1701L19.59 5.59006L21 7.00006Z" fill="black"/>
        </svg>
      </span>
    );
  }

  // On mount, do NOT prompt for geolocation, only use browser timezone
  useEffect(() => {
    // No geolocation prompt. Only use browser timezone.
    if (inputValue.trim().length > 0) {
      handleCreateEvents();
    }
    // eslint-disable-next-line
  }, []);

  async function handleCreateEvents() {
    if (inputValue.trim().length > 0) {
      setError("");
      setLoading(true);
      setGlobalLoading(true);
      try {
        // Get user's local timezone only
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Get user's current local time in ISO format
        const currentTime = new Date().toISOString();
        if (!timezone) {
          alert('Could not detect your timezone. Please check your device settings or try a different browser.');
        }
        const res = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputValue, timezone, currentTime })
        });
        const data = await res.json();
        console.log('[calevents] AI backend returned:', data.events);
        if (data.error) {
          setResults([]);
          setError(data.error);
          setLoading(false);
          setGlobalLoading(false);
          return;
        }
        // data.events is an array of event JSONs from AI
        const newResults = (data.events || []).map(event => {
          let link = "";
          if (calendarType === "google") {
            // Google Calendar link generation
            link = event.google_link || generateGoogleCalendarLink(event);
          } else if (calendarType === "outlook") {
            // Prefer backend-generated local time Outlook link if available
            link = event.outlook_link_local || event.outlook_link || generateOutlookCalendarLink(event);
          } else if (calendarType === "ical") {
            // Use server-based .ics link for Apple/iCalendar
            link = event.ics_link;
          }
          return {
            title: event.title,
            calendarType,
            link,
            isICS: calendarType === "ical"
          };
        });
        console.log('[calevents] Frontend results to render:', newResults);
        setResults(newResults);
      } catch (e) {
        setResults([]);
        setError("Failed to parse events. Please try again.");
        console.error('[calevents] Error in handleCreateEvents:', e);
      } finally {
        setLoading(false);
        setGlobalLoading(false);
      }
    } else {
      setError("Event details not provided!");
      setResults([]);
    }
  }

  // --- Helper functions for link generation ---
  function generateGoogleCalendarLink(event) {
    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const params = [
      `text=${encodeURIComponent(event.title)}`,
      `dates=${formatDateUTC(event.start)}/${formatDateUTC(event.end)}`,
      `details=${encodeURIComponent(event.description)}`,
      `location=${encodeURIComponent(event.location || '')}`
    ].join('&');
    return `${base}&${params}`;
  }

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

  function generateICS(event) {
    return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nDTSTART:${formatDate(event.start)}\nDTEND:${formatDate(event.end)}\nLOCATION:${event.location || ''}\nEND:VEVENT\nEND:VCALENDAR`;
  }

  function formatDate(dateStr) {
    // Format date as YYYYMMDDTHHmmssZ (basic, assumes input is ISO)
    return dateStr.replace(/[-:]/g, '').replace(/\.\d+Z$/, '').replace('T', 'T').replace(/\+/g, 'Z');
  }

  function formatDateUTC(dateStr) {
    const date = new Date(dateStr);
    return date.toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z').replace('T', 'T');
  }

  return (
    <>
      <div className={
        'main-frame' +
        ((error || results.length > 0) ? ' main-frame-animate-size' : '') +
        (globalLoading ? ' global-loading' : '')
      }
      style={{ }}
      >
        <div className="main-head">
          <div className="main-head-frame2">
            <span className="main-head-frame2-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 19H5V7.99997H19M16 0.999969V2.99997H8V0.999969H6V2.99997H5C3.89 2.99997 3 3.88997 3 4.99997V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V4.99997C21 4.46954 20.7893 3.96083 20.4142 3.58576C20.0391 3.21068 19.5304 2.99997 19 2.99997H18V0.999969M17 12H12V17H17V12Z" fill="black"/>
              </svg>
            </span>
            <span className="main-head-frame2-title">calevents</span>
          </div>
          <div className="main-head-subtitle">Turn any text into calendar links for Google, Outlook, or .ics. Free, private, and no login needed!</div>
        </div>
        <div className="main-divider" />
        <div className="calendar-type-section">
          <div className="calendar-type-label">Calendar Type</div>
          <div
            className="calendar-type-dropdown"
            tabIndex={0}
            ref={selectorRef}
            onClick={() => setDropdownOpen((v) => !v)}
            style={{ position: "relative" }}
          >
            <span className="calendar-type-dropdown-label">{CALENDAR_TYPES.find(t => t.value === calendarType).label}</span>
            <DropdownChevronIcon />
            <div
              ref={dropdownRef}
              className={
                "calendar-type-dropdown-list" +
                (dropdownOpen ? " open" : "")
              }
            >
              {CALENDAR_TYPES.map((type) => (
                <div
                  key={type.value}
                  className={
                    "calendar-type-dropdown-item" +
                    (calendarType === type.value ? " selected" : "")
                  }
                  onClick={() => handleSelect(type.value)}
                >
                  <span className="calendar-type-dropdown-item-label">{type.label}</span>
                  {calendarType === type.value && (
                    <DropdownCheckIcon />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="event-details-section">
          <div className="event-details-label">Event Details</div>
          <textarea
            className="event-details-textarea"
            placeholder="Type/paste your event details here or upload a file below."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            rows={6}
          />
          <div className="event-details-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: 0, padding: 0 }}>
            <FileDropZone
              onFileParsed={text => setInputValue(text)}
              loading={loading || globalLoading}
              clearInput={() => setInputValue("")}
            />
            {inputValue.trim() && (
              <div className="event-details-support">Reload the page to clear all data</div>
            )}
          </div>
        </div>
        <div className="main-btn-container">
          <button
            className="main-action-btn"
            onClick={handleCreateEvents}
            disabled={loading}
            style={globalLoading ? { opacity: 1 } : {}}
          >
            {(loading || globalLoading) && <span className="loading-spinner" style={{ marginRight: 8 }} />}
            {loading || globalLoading ? "Creating..." : "Create Events"}
          </button>
        </div>
        {(error || results.length > 0) && (
          <div className="main-result-divider" />
        )}
        {error && (
          <div className="main-result-section-wrapper fade-in-up">
            <div className="result-section" style={{ border: '1px solid #ff4d4f', background: '#fff6f6' }}>
              <span style={{ color: '#d8000c', fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif' }}>{error}</span>
            </div>
          </div>
        )}
        {results.length > 0 && (
          <DelayedReveal delayMs={850}>
            <StaggeredResults results={results} getResultButtonText={getResultButtonText} getResultButtonIcon={getResultButtonIcon} />
          </DelayedReveal>
        )}
        {/* Add further main content as instructed */}
      </div>
      {globalLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.5)',
          zIndex: 1000,
          pointerEvents: 'auto',
        }}
        aria-hidden="true"
        />
      )}
      <div className="footer-note">
        Built by <a href="https://shanmus4.framer.website/" className="footer-note-link" target="_blank" rel="noopener noreferrer"><b>Shanmu</b></a>. Source Code available on <a href="https://github.com/Shanmus4/Calevent" className="footer-note-link" target="_blank" rel="noopener noreferrer"><b>Github</b></a>.
      </div>
    </>
  );
}

// StaggeredResults component for staggered reveal
function StaggeredResults({ results, getResultButtonText, getResultButtonIcon }) {
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    if (!results.length) return;
    setVisibleCount(0);
    let i = 0;
    const revealNext = () => {
      setVisibleCount(v => v + 1);
      i++;
      if (i < results.length) {
        setTimeout(revealNext, 160);
      }
    };
    setTimeout(revealNext, 60); // slight delay before first
    return () => {};
  }, [results]);
  // Reason: For .ics results, trigger download via JS for iOS compatibility
  const handleICSDownload = (e, result) => {
    e.preventDefault();
    fetch(result.link)
      .then(resp => resp.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.title ? `${result.title.replace(/[^a-zA-Z0-9_-]+/g, '_')}.ics` : 'event.ics';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 150);
      });
  };
  return (
    <div className="main-result-section-wrapper">
      {results.slice(0, visibleCount).map((result, idx) => (
        <div className="result-section result-section-stagger fade-in-up" key={idx}>
          <span className="result-section-title">{result.title}</span>
          {result.isICS ? (
            <a
              className="result-section-btn no-underline"
              href={result.link}
              onClick={e => handleICSDownload(e, result)}
            >
              {getResultButtonText(result.calendarType)}
              {getResultButtonIcon(result.calendarType)}
            </a>
          ) : (
            <a
              className="result-section-btn no-underline"
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {getResultButtonText(result.calendarType)}
              {getResultButtonIcon(result.calendarType)}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// DelayedReveal component for revealing children after a delay
function DelayedReveal({ delayMs = 800, children }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return show ? children : null;
}