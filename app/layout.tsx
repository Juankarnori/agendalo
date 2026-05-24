import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: { default: 'Agendalo', template: '%s | Agendalo' },
  description: 'Sistema de reservas online simple y profesional.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={geist.variable}>
      <body className="min-h-screen flex flex-col bg-[#0f0f14] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
