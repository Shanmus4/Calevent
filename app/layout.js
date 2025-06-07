import './globals.css'
import "../public/fonts.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'calevents | Free AI Calendar Link Generator',
  description: 'calevents makes it easy to turn any text, email, or message into ready-to-use Google, Outlook, or .ics calendar links. 100% free, private, and no login needed. Perfect for meetings, reminders, and events.',
  keywords: [
    'calevents', 'calendar event generator', 'ai calendar', 'google calendar link generator',
    'outlook calendar link generator', 'ics file generator', 'free calendar tool', 'add to calendar from text',
    'event parser ai', 'privacy-first calendar app', 'natural language processing calendar',
    'calendar invite creator', 'text to event converter', 'online calendar tool', 'no login calendar',
    'secure calendar link', 'meeting scheduler ai', 'travel itinerary calendar', 'event extraction tool'
  ],
  openGraph: {
    title: 'calevents | Free AI Calendar Link Generator',
    description: 'calevents instantly creates Google, Outlook, and .ics calendar links from any text. Free, private, and no sign up required.',
    url: 'https://calevents.vercel.app',
    siteName: 'calevents',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'calevents app screenshot',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@calevents_app',
    title: 'calevents',
    description: 'calevents instantly creates Google, Outlook, and .ics calendar links from any text. Free, private, and no sign up required.',
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
        <link rel="canonical" href="https://calevents.vercel.app" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Open Graph and Twitter tags handled via metadata above for Next.js 13+ */}
        {/* Structured Data for SEO (inlined) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "calevents | Free AI Calendar Link Generator",
              "url": "https://calevents.vercel.app/",
              "description": "calevents makes it easy to turn any text, email, or message into ready-to-use Google, Outlook, or .ics calendar links. 100% free, private, and no login needed. Perfect for meetings, reminders, and events.",
              "applicationCategory": "ProductivityApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "reviewCount": "100"
              }
            })
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
