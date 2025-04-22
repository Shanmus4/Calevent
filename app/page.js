"use client";
import { useState, useRef, useEffect } from "react";

// Main page with main-frame section, head, divider, calendar type, event details, button container (with main button), and footer note (with bold underlined links)
const CALENDAR_TYPES = [
  { label: "Google", value: "google" },
  { label: "Outlook", value: "outlook" },
  { label: "iCalendar", value: "ical" },
];

// Dummy event title and parse state for demo; replace with real logic as needed
const DEMO_EVENT_TITLE = "Team Sync Meeting";

export default function Home() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [calendarType, setCalendarType] = useState("google");
  const [parsingComplete, setParsingComplete] = useState(false); // set to true for demo
  const [eventTitle, setEventTitle] = useState(DEMO_EVENT_TITLE); // replace with real event title
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
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
    if (type === "google") return "Open Google Calendar Link";
    if (type === "outlook") return "Open Outlook Calendar Link";
    return "Download ics file";
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
          <path d="M10 4.00012H6C5.46957 4.00012 4.96086 4.21084 4.58579 4.58591C4.21071 4.96098 4 5.46969 4 6.00012V18.0001C4 18.5306 4.21071 19.0393 4.58579 19.4143C4.96086 19.7894 5.46957 20.0001 6 20.0001H18C18.5304 20.0001 19.0391 19.7894 19.4142 19.4143C19.7893 19.0393 20 18.5306 20 18.0001V14.0001M12 12.0001L20 4.00012M20 4.00012V9.00012M20 4.00012H15" stroke="#5C5C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }

  function handleCreateInvites() {
    // Demo: Only show result if textarea has content
    if (inputValue.trim().length > 0) {
      setEventTitle(inputValue.trim()); // In real app, use parsed event title
      setParsingComplete(true);
      setError("");
    } else {
      setParsingComplete(false);
      setError("Event details not provided!");
    }
  }

  return (
    <>
      <div className="main-frame">
        <div className="main-head">
          <div className="main-head-frame2">
            <span className="main-head-frame2-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 19H5V7.99997H19M16 0.999969V2.99997H8V0.999969H6V2.99997H5C3.89 2.99997 3 3.88997 3 4.99997V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V4.99997C21 4.46954 20.7893 3.96083 20.4142 3.58576C20.0391 3.21068 19.5304 2.99997 19 2.99997H18V0.999969M17 12H12V17H17V12Z" fill="black"/>
              </svg>
            </span>
            <span className="main-head-frame2-title">calevent</span>
          </div>
          <div className="main-head-subtitle">Create calendar events with one click!</div>
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
            <span className="calendar-type-dropdown-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8.25 15.0001L12 18.7501L15.75 15.0001M8.25 9.00006L12 5.25006L15.75 9.00006" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
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
                    <span className="calendar-type-dropdown-item-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 7.00006L9 19.0001L3.5 13.5001L4.91 12.0901L9 16.1701L19.59 5.59006L21 7.00006Z" fill="black"/>
                      </svg>
                    </span>
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
            placeholder="Provide any necessary details to describe the event or just copy and paste the event mail/message."
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              if (error) setError("");
            }}
          />
        </div>
        <div className="main-btn-container">
          <button className="main-action-btn" onClick={handleCreateInvites}>Create Invites</button>
        </div>
        {error && (
          <div className="main-result-section-wrapper">
            <div className="main-result-divider" />
            <div className="result-section" style={{ border: '1px solid #ff4d4f', background: '#fff6f6' }}>
              <span style={{ color: '#d8000c', fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif' }}>{error}</span>
            </div>
          </div>
        )}
        {parsingComplete && (
          <div className="main-result-section-wrapper">
            <div className="main-result-divider" />
            <div className="result-section">
              <span className="result-section-title">{eventTitle}</span>
              <button className="result-section-btn">
                {getResultButtonText(calendarType)}
                {getResultButtonIcon(calendarType)}
              </button>
            </div>
          </div>
        )}
        {/* Add further main content as instructed */}
      </div>
      <div className="footer-note">
        Built by <a href="https://shanmus4.framer.website/" className="footer-note-link" target="_blank" rel="noopener noreferrer"><b>Shanmu</b></a>. Source Code available on <a href="https://github.com/Shanmus4/Calevent" className="footer-note-link" target="_blank" rel="noopener noreferrer"><b>Github</b></a>.
      </div>
    </>
  );
}
