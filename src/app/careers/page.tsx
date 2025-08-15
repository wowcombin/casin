'use client'
import { useState } from 'react'

export default function CareersPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    message: ''
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const positions = [
    {
      title: 'Content Writer - Recenzii Cazinouri',
      type: 'Full-time',
      salary: '3000-5000 RON',
      description: 'Căutăm un content writer cu experiență în gambling pentru crearea de recenzii detaliate și conținut SEO.'
    },
    {
      title: 'Affiliate Manager',
      type: 'Full-time', 
      salary: '4000-7000 RON',
      description: 'Gestionarea relațiilor cu partenerii, negocierea contractelor și optimizarea campaniilor de marketing.'
    },
    {
      title: 'SEO Specialist',
      type: 'Part-time/Full-time',
      salary: '2500-4500 RON',
      description: 'Optimizarea site-ului pentru motoarele de căutare și creșterea traficului organic.'
    },
    {
      title: 'Social Media Manager',
      type: 'Part-time',
      salary: '2000-3500 RON',
      description: 'Gestionarea rețelelor sociale și crearea strategiilor de marketing digital.'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const response = await fetch('/api/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setStatus('✓ Candidatura ta a fost trimisă cu succes! Te vom contacta în curând.')
        setFormData({ name: '', email: '', phone: '', position: '', message: '' })
      } else {
        setStatus('❌ Eroare la trimiterea candidaturii')
      }
    } catch (error) {
      setStatus('❌ Eroare la trimiterea candidaturii')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
              💼 <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Cariere
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Alătură-te echipei Cazino Review România și construiește viitorul industriei de gambling online din România. 
              Oferim un mediu dinamic, salariu competitiv și oportunități de dezvoltare.
            </p>
          </div>
        </div>
      </header>

      {/* Benefits Section */}
      <section className="py-16 bg-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            De ce să lucrezi cu noi?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Salariu Competitiv</h3>
              <p className="text-blue-200 text-sm">Remunerare pe măsura performanței</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Remote Work</h3>
              <p className="text-blue-200 text-sm">Lucrează de oriunde din România</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Creștere Rapidă</h3>
              <p className="text-blue-200 text-sm">Oportunități de avansare în carieră</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-red-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Proiecte Interesante</h3>
              <p className="text-blue-200 text-sm">Lucrează la cel mai mare site de cazinouri</p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Poziții Deschise
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {positions.map((position, index) => (
              <div key={index} className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{position.title}</h3>
                  <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                    {position.type}
                  </span>
                </div>
                
                <p className="text-blue-200 mb-4">{position.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400 font-bold">{position.salary}</span>
                  <button 
                    onClick={() => setFormData({...formData, position: position.title})}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all"
                  >
                    Aplică Acum
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 bg-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-8">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Aplică pentru o Poziție
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-blue-200 font-medium mb-2">
                    Nume Complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Ion Popescu"
                  />
                </div>

                <div>
                  <label className="block text-blue-200 font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="ion@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-blue-200 font-medium mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="0722 123 456"
                  />
                </div>

                <div>
                  <label className="block text-blue-200 font-medium mb-2">
                    Poziția Dorită *
                  </label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="">Selectează poziția</option>
                    {positions.map((pos, index) => (
                      <option key={index} value={pos.title} className="bg-gray-800">
                        {pos.title}
                      </option>
                    ))}
                    <option value="Altă poziție" className="bg-gray-800">Altă poziție</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Mesaj / CV / Experiență *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  placeholder="Spune-ne despre experiența ta, de ce vrei să lucrezi cu noi, și atasează link către CV-ul tău..."
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
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Se trimite...' : '🚀 Trimite Candidatura'}
              </button>
            </form>
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
