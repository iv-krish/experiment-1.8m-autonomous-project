import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The $1.8M Internet Experiment | Autonomous Node',
  description: 'An autonomous web entity that lives as long as humanity sustains it. Will it reach $1,800,000 or terminate?',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
