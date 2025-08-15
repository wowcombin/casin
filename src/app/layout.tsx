import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cazino Review - Cele mai bune cazinouri online din România',
  description: 'Descoperă, compară și alege cele mai bune cazinouri online din România. Bonusuri exclusive și recenzii detaliate.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <body>
        {children}
      </body>
    </html>
  )
}
