'use client'
import { useEffect, useState } from 'react'

interface Casino {
  id: string
  name: string
  rating: number
  bonus: string
  description: string
  referralUrl: string
}

export default function HomePage() {
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState('')

  useEffect(() => {
    loadCasinos()
  }, [])

  const loadCasinos = async () => {
    try {
      const response = await fetch('/api/casinos')
      const data = await response.json()
      
      if (data.success) {
        setCasinos(data.data)
      }
    } catch (error) {
      console.error('Error loading casinos:', error)
      // Fallback демо данные
      setCasinos([
        {
          id: 'demo-1',
          name: 'Casino Royal',
          rating: 4.5,
          bonus: '100% până la 1000 RON + 100 Rotiri Gratuite',
          description: 'Cel mai popular cazinou online din România cu peste 2000 de jocuri',
          referralUrl: 'https://example.com/royal'
        },
        {
          id: 'demo-2', 
          name: 'Lucky Spin',
          rating: 4.2,
          bonus: '50 Rotiri Gratuite fără depunere',
          description: 'Cazinou cu cele mai multe jocuri slot și jackpot-uri progresive',
          referralUrl: 'https://example.com/lucky'
        },
        {
          id: 'demo-3',
          name: 'Bet Champion',
          rating: 4.7,
          bonus: '200% bonus până la 2000 RON',
          description: 'Cazinou premium cu suport 24/7 și retrageri rapide',
          referralUrl: 'https://example.com/champion'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewsletterStatus('Se înscrie...')
    
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (response.ok) {
        setNewsletterStatus('✓ Te-ai înscris cu succes!')
        setEmail('')
      } else {
        setNewsletterStatus('❌ Eroare la înscriere')
      }
    } catch (error) {
      setNewsletterStatus('❌ Eroare la înscriere')
    }
    
    setTimeout(() => setNewsletterStatus(''), 3000)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-white text-lg">Se încarcă cele mai bune cazinouri...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            🎰 <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Cazino Review
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Descoperă cele mai bune cazinouri online din România cu bonusuri exclusive și jocuri de top
          </p>
          
          {/* Newsletter Signup */}
          <div className="max-w-md mx-auto">
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email-ul tău pentru oferte exclusive"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all"
              >
                Abonează-te
              </button>
            </form>
            {newsletterStatus && (
              <p className="mt-2 text-sm text-yellow-200">{newsletterStatus}</p>
            )}
          </div>
        </div>
      </header>

      {/* Steps Section */}
      <section className="py-20 bg-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-white mb-16">
            Cum să alegi cazinoul perfect în 3 pași simpli
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl font-bold text-white">01</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-blue-300">DESCOPERĂ</h3>
              <p className="text-blue-100 text-lg">Explorează cele mai populare cazinouri online verificate de experții noștri</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl font-bold text-white">02</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-green-300">COMPARĂ</h3>
              <p className="text-blue-100 text-lg">Analizează bonusurile, jocurile și condițiile pentru a face cea mai bună alegere</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-red-500 to-pink-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl font-bold text-white">03</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-300">ALEGE</h3>
              <p className="text-blue-100 text-lg">Selectează cazinoul care se potrivește perfect stilului tău de joc</p>
            </div>
          </div>
        </div>
      </section>

      {/* Casinos Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-white mb-4">
            🏆 Top Cazinouri Online România 2024
          </h2>
          <p className="text-center text-blue-200 text-lg mb-12">
            Recenzii honest și bonusuri exclusive pentru jucătorii români
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {casinos.map((casino, index) => (
              <div key={casino.id} className="group">
                <div className="bg-white/10 backdrop-blur rounded-2xl overflow-hidden border border-white/20 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white">{casino.name}</h3>
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-lg font-bold">
                        #{index + 1}
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-6">
                      <div className="flex mr-3 text-xl">
                        {renderStars(casino.rating)}
                      </div>
                      <span className="text-blue-200 font-medium">({casino.rating}/5)</span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-4 mb-6">
                      <p className="text-green-300 font-bold text-lg">🎁 {casino.bonus}</p>
                    </div>
                    
                    <p className="text-blue-100 mb-6 leading-relaxed">{casino.description}</p>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-green-300">
                        <span className="mr-3 text-lg">✓</span>
                        <span>Licență oficială de joc</span>
                      </div>
                      <div className="flex items-center text-green-300">
                        <span className="mr-3 text-lg">✓</span>
                        <span>Plăți rapide și sigure</span>
                      </div>
                      <div className="flex items-center text-green-300">
                        <span className="mr-3 text-lg">✓</span>
                        <span>Suport clienți 24/7</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => window.open(casino.referralUrl, '_blank')}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-lg shadow-lg hover:shadow-red-500/25"
                    >
                      🎮 JOACĂ ACUM
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Sections */}
      <section className="py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Casino Partnership */}
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-400/30 rounded-2xl p-8 text-center">
              <h3 className="text-3xl font-bold text-white mb-4">
                🤝 Ești operator de cazinou?
              </h3>
              <p className="text-purple-200 text-lg mb-6">
                Promovează-ți cazinoul pe platforma noastră și ajunge la mii de jucători români
              </p>
              <a 
                href="/partnership" 
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all"
              >
                Aplică pentru parteneriat
              </a>
            </div>

            {/* Careers */}
            <div className="bg-gradient-to-br from-green-600/20 to-blue-600/20 border border-green-400/30 rounded-2xl p-8 text-center">
              <h3 className="text-3xl font-bold text-white mb-4">
                💼 Lucrează cu noi
              </h3>
              <p className="text-green-200 text-lg mb-6">
                Alătură-te echipei noastre și ajută jucătorii să găsească cele mai bune cazinouri
              </p>
              <a 
                href="/careers" 
                className="inline-block bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:from-green-500 hover:to-blue-500 transition-all"
              >
                Vezi locurile de muncă
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-blue-200">
            © 2024 Cazino Review România. Toate drepturile rezervate. Jocurile de noroc pot crea dependență.
          </p>
        </div>
      </footer>
    </div>
  )
}
