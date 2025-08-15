'use client'
import { useState } from 'react'

export default function PartnershipPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    website: '',
    message: ''
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const response = await fetch('/api/partnership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setStatus('✓ Cererea ta a fost trimisă cu succes! Te vom contacta în curând.')
        setFormData({ companyName: '', email: '', website: '', message: '' })
      } else {
        setStatus('❌ Eroare la trimiterea cererii')
      }
    } catch (error) {
      setStatus('❌ Eroare la trimiterea cererii')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="relative py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <a href="/" className="inline-block mb-8 text-blue-300 hover:text-white transition-colors">
              ← Înapoi la pagina principală
            </a>
            <h1 className="text-5xl font-bold text-white mb-6">
              🤝 <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Parteneriat Cazinou
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Alătură-te rețelei noastre de cazinouri partenere și ajunge la mii de jucători români activi. 
              Oferim promoții targeted și trafic de calitate.
            </p>
          </div>
        </div>
      </header>

      {/* Benefits Section */}
      <section className="py-16 bg-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            De ce să alegi Cazino Review România?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Trafic de Calitate</h3>
              <p className="text-blue-200 text-sm">Peste 50.000 de vizitatori unici lunar</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Audiență Țintită</h3>
              <p className="text-blue-200 text-sm">Jucători români interesați de cazinouri online</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Rapoarte Detaliate</h3>
              <p className="text-blue-200 text-sm">Tracking complet al conversiilor și performanței</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-red-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Poziție Privilegiată</h3>
              <p className="text-blue-200 text-sm">Promovare în top și recenzii preferențiale</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-8">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Aplică pentru Parteneriat
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Numele Companiei *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="ex: Royal Casino SRL"
                />
              </div>

              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Email de Contact *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="contact@yourexample.com"
                />
              </div>

              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Website Cazinou
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="https://yourexample.com"
                />
              </div>

              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Mesaj / Detalii despre Proiect *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  placeholder="Spune-ne despre cazinoul tău, ce fel de colaborare îți dorești, ce comisioane oferi, etc."
                />
              </div>

              {status && (
                <div className="text-center">
                  <p className={`text-lg ${status.includes('✓') ? 'text-green-300' : 'text-red-300'}`}>
                    {status}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Se trimite...' : '📨 Trimite Cererea'}
              </button>
            </form>

            <div className="mt-8 text-center text-blue-200 text-sm">
              <p>Te vom contacta în maxim 48 de ore pentru a discuta detaliile colaborării.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-blue-200">
            © 2024 Cazino Review România. Toate drepturile rezervate.
          </p>
        </div>
      </footer>
    </div>
  )
}
