export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Cazino Review România
          </h1>
          <p className="text-gray-600 mt-2">
            Descoperă • Compară • Alege
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Cele mai bune cazinouri online din România
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Găsește cazinoul perfect pentru tine cu ajutorul recenziilor noastre detaliate
          </p>
          
          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">01</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">DESCOPERĂ</h3>
              <p className="text-gray-600">Explorează cele mai populare cazinouri</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">02</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">COMPARĂ</h3>
              <p className="text-gray-600">Analizează bonusurile și caracteristicile</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">03</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">ALEGE</h3>
              <p className="text-gray-600">Selectează cazinoul ideal pentru tine</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
