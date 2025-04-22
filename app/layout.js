import './globals.css'
import "../public/fonts.css";

export const metadata = {
  title: 'Calendar Event Generator | AI to Calendar Links',
  description: 'Create Google, Outlook, or .ics calendar events instantly from any email, message, or text using AI. 100% private, no login required.',
  keywords: ['calendar event generator', 'ai calendar', 'google calendar link', 'outlook calendar link', 'ics generator', 'add to calendar', 'event parser', 'privacy-first calendar', 'natural language to calendar', 'calendar invite ai'],
  openGraph: {
    title: 'Calendar Event Generator',
    description: 'Extract and create calendar events from any text using AI. Supports Google, Outlook, and .ics. No login, no data stored.',
    url: 'https://calevent.app',
    siteName: 'Calendar Event Generator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Calendar Event Generator Screenshot',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@calevent_app',
    title: 'Calendar Event Generator',
    description: 'Extract and create calendar events from any text using AI. Supports Google, Outlook, and .ics. No login, no data stored.',
    images: ['/og-image.png']
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#F8F8F8" />
        <meta name="author" content="Shanmu" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://calevent.app" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Open Graph and Twitter tags handled via metadata above for Next.js 13+ */}
      </head>
      <body>{children}</body>
    </html>
  )
}
