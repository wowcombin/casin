'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [stats, setStats] = useState({
    totalCasinos: 0,
    totalClicks: 0,
    totalRevenue: 0,
    totalUsers: 0
  })
  const [data, setData] = useState({
    partnerships: [],
    jobApplications: [],
    newsletters: []
  })
  const router = useRouter()

  useEffect(() => {
    // Проверяем авторизацию
    const isLoggedIn = localStorage.getItem('admin_logged_in')
    if (!isLoggedIn) {
      router.push('/admin/login')
      return
    }

    // Инициализируем данные
    initDashboard()
  }, [router])

  const initDashboard = async () => {
    try {
      // Инициализируем БД
      await fetch('/api/init', { method: 'POST' })
      
      setStats({
        totalCasinos: 3,
        totalClicks: 0,
        totalRevenue: 0,
        totalUsers: 1
      })

      // Демо данные для отчетов
      setData({
        partnerships: [
          { id: 1, companyName: 'Royal Casino SRL', email: 'contact@royal.com', status: 'PENDING', createdAt: new Date() },
          { id: 2, companyName: 'Lucky Games Ltd', email: 'info@lucky.com', status: 'APPROVED', createdAt: new Date() }
        ],
        jobApplications: [
          { id: 1, name: 'Ion Popescu', email: 'ion@example.com', position: 'Content Writer', status: 'PENDING', createdAt: new Date() },
          { id: 2, name: 'Maria Ionescu', email: 'maria@example.com', position: 'SEO Specialist', status: 'REVIEWING', createdAt: new Date() }
        ],
        newsletters: [
          { id: 1, email: 'user1@example.com', subscribedAt: new Date() },
          { id: 2, email: 'user2@example.com', subscribedAt: new Date() }
        ]
      })
    } catch (error) {
      console.error('Error initializing dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in')
    router.push('/admin/login')
  }

  const renderDashboard = () => (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Cazinouri</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalCasinos}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Newsletter Subscribers</dt>
                  <dd className="text-lg font-medium text-gray-900">{data.newsletters.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🤝</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Partnership Requests</dt>
                  <dd className="text-lg font-medium text-gray-900">{data.partnerships.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💼</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Job Applications</dt>
                  <dd className="text-lg font-medium text-gray-900">{data.jobApplications.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Acțiuni Rapide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveSection('casinos')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Gestionează Cazinouri
            </button>
            <button 
              onClick={() => setActiveSection('users')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Gestionează Utilizatori
            </button>
            <button 
              onClick={() => setActiveSection('reports')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Vezi Rapoarte
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCasinos = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Gestionare Cazinouri</h3>
        <div className="mb-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            + Adaugă Cazinou Nou
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Casino Royal</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4.5/5</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100% până la 1000 RON</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Lucky Spin</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4.2/5</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">50 Rotiri Gratuite</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Gestionare Utilizatori & Aplicații</h3>
        
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-700 mb-4">Partnership Requests</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Companie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.partnerships.map((partnership: any) => (
                  <tr key={partnership.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{partnership.companyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partnership.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        partnership.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {partnership.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-green-600 hover:text-green-900 mr-2">Approve</button>
                      <button className="text-red-600 hover:text-red-900">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-700 mb-4">Job Applications</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poziție</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.jobApplications.map((application: any) => (
                  <tr key={application.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{application.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{application.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{application.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-green-600 hover:text-green-900 mr-2">Accept</button>
                      <button className="text-red-600 hover:text-red-900">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReports = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Rapoarte și Statistici</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-2">Newsletter Subscribers</h4>
            <p className="text-2xl font-bold text-blue-600">{data.newsletters.length}</p>
            <p className="text-sm text-gray-500">Total subscribers</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-2">Partnership Requests</h4>
            <p className="text-2xl font-bold text-green-600">{data.partnerships.length}</p>
            <p className="text-sm text-gray-500">Total requests</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-2">Job Applications</h4>
            <p className="text-2xl font-bold text-purple-600">{data.jobApplications.length}</p>
            <p className="text-sm text-gray-500">Total applications</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-2">Active Casinos</h4>
            <p className="text-2xl font-bold text-red-600">{stats.totalCasinos}</p>
            <p className="text-sm text-gray-500">Listed casinos</p>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-700 mb-4">Recent Newsletter Subscribers</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Înscrierii</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.newsletters.map((subscriber: any) => (
                  <tr key={subscriber.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscriber.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscriber.subscribedAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveSection('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeSection === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveSection('casinos')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeSection === 'casinos' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cazinouri
              </button>
              <button
                onClick={() => setActiveSection('users')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeSection === 'users' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Utilizatori
              </button>
              <button
                onClick={() => setActiveSection('reports')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeSection === 'reports' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rapoarte
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Deconectare
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'casinos' && renderCasinos()}
        {activeSection === 'users' && renderUsers()}
        {activeSection === 'reports' && renderReports()}
      </main>
    </div>
  )
}
