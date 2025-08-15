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

  useEffect(() => {
    // Инициализируем данные казино
    initializeCasinos()
  }, [])

  const initializeCasinos = async () => {
    try {
      await fetch('/api/init', { method: 'POST' })
      
      // Демо данные казино
      setCasinos([
        {
          id: 'casino-1',
          name: 'Casino Royal',
          rating: 4.5,
          bonus: '100% până la 1000 RON + 100 Rotiri Gratuite',
          description: 'Cel mai popular cazinou online din România cu peste 2000 de jocuri',
          referralUrl: 'https://example.com/royal'
        },
        {
          id: 'casino-2', 
          name: 'Lucky Spin',
          rating: 4.2,
          bonus: '50 Rotiri Gratuite fără depunere',
          description: 'Cazinou cu cele mai multe jocuri slot și jackpot-uri progresive',
          referralUrl: 'https://example.com/lucky'
        },
        {
          id: 'casino-3',
          name: 'Bet Champion',
          rating: 4.7,
          bonus: '200% bonus până la 2000 RON',
          description: 'Cazinou premium cu suport 24/7 și retrageri rapide',
          referralUrl: 'https://example.com/champion'
        }
      ])
    } catch (error) {
      console.error('Error initializing casinos:', error)
    } finally {
      setLoading(false)
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă cazinouri...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                Cazino Review România
              </h1>
              <p className="text-gray-600 mt-2">
                Descoperă • Compară • Alege
              </p>
            </div>
            <a 
              href="/admin/login"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Admin Login
            </a>
          </div>
        </div>
      </header>

      {/* Steps Section */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cum să alegi cazinoul perfect
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-blue-600">01</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-600">DESCOPERĂ</h3>
              <p className="text-gray-600">Explorează cele mai populare cazinouri online verificate de experți</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-green-600">02</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-green-600">COMPARĂ</h3>
              <p className="text-gray-600">Analizează bonusurile, jocurile și condițiile fiecărui cazinou</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-red-600">03</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-600">ALEGE</h3>
              <p className="text-gray-600">Selectează cazinoul care se potrivește perfect stilului tău de joc</p>
            </div>
          </div>
        </div>
      </section>

      {/* Casinos Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Top Cazinouri Online România 2024
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {casinos.map((casino, index) => (
              <div key={casino.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{casino.name}</h3>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <div className="flex mr-2">
                      {renderStars(casino.rating)}
                    </div>
                    <span className="text-gray-600 text-sm">({casino.rating}/5)</span>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-green-800 font-medium text-sm">🎁 {casino.bonus}</p>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{casino.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Licență oficială de joc</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Plăți rapide și sigure</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Suport clienți 24/7</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => window.open(casino.referralUrl, '_blank')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                  >
                    JOACĂ ACUM
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
