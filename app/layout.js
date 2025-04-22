import './globals.css'

export const metadata = {
  title: 'Calendar Event Generator',
  description: 'Extract calendar events from emails and generate invite links',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
