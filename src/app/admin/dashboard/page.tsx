'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [googleAuthStatus, setGoogleAuthStatus] = useState<'checking' | 'authenticated' | 'not_authenticated' | 'error'>('checking')
  const [googleInfo, setGoogleInfo] = useState<any>(null)
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
    const isLoggedIn = localStorage.getItem('admin_logged_in')
    if (!isLoggedIn) {
      router.push('/admin/login')
      return
    }
    initDashboard()
    checkGoogleAuth()
  }, [router])

  const initDashboard = async () => {
    try {
      await fetch('/api/init', { method: 'POST' })
      
      setStats({
        totalCasinos: 3,
        totalClicks: 0,
        totalRevenue: 0,
        totalUsers: 1
      })

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

  const checkGoogleAuth = async () => {
    try {
      console.log('Checking Google authentication status...')
      const response = await fetch('/api/hr/import-sheets')
      const result = await response.json()
      
      console.log('Google auth check result:', result)
      
      if (result.success) {
        setGoogleAuthStatus('authenticated')
        setGoogleInfo(result.data)
      } else if (result.data?.status === 'not_authenticated') {
        setGoogleAuthStatus('not_authenticated')
        setGoogleInfo(result.data)
      } else {
        setGoogleAuthStatus('error')
        setGoogleInfo(result.data)
      }
    } catch (error) {
      console.error('Error checking Google auth:', error)
      setGoogleAuthStatus('error')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in')
    router.push('/admin/login')
  }

  const calculateProfits = async () => {
    try {
      setLoading(true)
      
      const currentDate = new Date()
      const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      console.log('Calculating profits for:', currentMonth)
      
      const response = await fetch('/api/hr/calculate-profits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth })
      })
      
      const result = await response.json()
      
      if (result.success) {
        const data = result.data
        alert(`✅ Прибыль рассчитана!\n\nМесяц: ${data.month}\nКурс: ${data.rate}\nОбщая база: $${data.totalBase}\nОбщая прибыль: $${data.totalProfit}\n\n${data.message}`)
      } else {
        alert('❌ Ошибка при расчете: ' + result.error)
      }
      
    } catch (error) {
      console.error('Calculation error:', error)
      alert('❌ Ошибка при расчете прибыли')
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyProfits = async (month: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/hr/calculate-profits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month })
      })
      
      const result = await response.json()
      
      if (result.success) {
        const data = result.data
        alert(`✅ Прибыль за ${month} рассчитана!\n\nКурс: ${data.rate}\nОбщая база: $${data.totalBase}\nОбщая прибыль: $${data.totalProfit}`)
      } else {
        alert('❌ Ошибка при расчете: ' + result.error)
      }
    } catch (error) {
      console.error('Monthly calculation error:', error)
      alert('❌ Ошибка при расчете прибыли')
    } finally {
      setLoading(false)
    }
  }

  const addEmployee = () => {
    const nickname = prompt('Введите nickname сотрудника (например: @username):')
    if (nickname) {
      alert(`Сотрудник ${nickname} будет добавлен`)
    }
  }

  const importFromSheets = async () => {
    try {
      setLoading(true)
      
      // Проверяем статус авторизации
      if (googleAuthStatus === 'not_authenticated') {
        const confirmAuth = window.confirm('Требуется авторизация Google Drive. Перейти к авторизации?')
        if (confirmAuth) {
          window.location.href = '/api/auth/google'
          return
        } else {
          setLoading(false)
          return
        }
      }
      
      const currentDate = new Date()
      const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      console.log('Starting import for month:', currentMonth)
      
      const response = await fetch('/api/hr/import-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          month: currentMonth
        })
      })
      
      const result = await response.json()
      console.log('Import result:', result)
      
      if (result.success) {
        // Показываем подробную информацию
        const data = result.data
        alert(`✅ Импорт завершен!\n\n${data.message}`)
        initDashboard()
        checkGoogleAuth()
      } else if (result.needsAuth) {
        setGoogleAuthStatus('not_authenticated')
        const confirmAuth = window.confirm(`Требуется авторизация Google Drive.\n\nОшибка: ${result.error}\n\nПерейти к авторизации?`)
        if (confirmAuth) {
          window.location.href = '/api/auth/google'
        }
      } else {
        alert(`❌ Ошибка при импорте:\n\n${result.error}`)
      }
      
    } catch (error) {
      console.error('Import error:', error)
      alert('❌ Ошибка при импорте данных')
    } finally {
      setLoading(false)
    }
  }

  const testGoogleConnection = async () => {
    try {
      setLoading(true)
      console.log('Testing Google Drive connection...')
      
      const response = await fetch('/api/hr/import-sheets')
      const result = await response.json()
      
      console.log('Connection test result:', result)
      
      if (result.success) {
        const info = result.data
        alert(`✅ Google Drive подключение успешно!\n\n📁 Папка: ${info.folderName}\n👥 Найдено сотрудников: ${info.employeeFolders}\n📋 Примеры: ${info.employees?.join(', ') || 'Нет данных'}\n\nСтатус: ${info.message}`)
      } else {
        alert(`❌ Ошибка подключения:\n\n${result.data?.message || result.error}\n\nСтатус: ${result.data?.status}`)
      }
      
      checkGoogleAuth()
    } catch (error) {
      console.error('Connection test error:', error)
      alert('❌ Ошибка при тестировании подключения')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    alert('Экспорт отчета будет реализован')
  }

  const renderDashboard = () => (
    <div>
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

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Acțiuni Rapide</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <button 
              onClick={() => router.push('/admin/accounting')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              📊 Просмотр Бухгалтерии
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">HR Управление</h3>
            <div className="space-x-2">
              <button 
                onClick={() => calculateProfits()}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Расчет...' : 'Рассчитать Прибыль'}
              </button>
              <button 
                onClick={() => addEmployee()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                + Добавить Сотрудника
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nickname</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Month Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">@opporenno</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Junior</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$850.50</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-2">View</button>
                    <button className="text-red-600 hover:text-red-900">Deactivate</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">@sobroffice</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Tester</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$1,250.75</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-2">View</button>
                    <button className="text-red-600 hover:text-red-900">Deactivate</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-blue-900 mb-2">Месячный Расчет</h4>
              <p className="text-sm text-blue-700 mb-3">Запустить автоматический расчет прибыли за месяц</p>
              <button 
                onClick={() => calculateMonthlyProfits('December 2024')}
                disabled={loading}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Расчет...' : 'Рассчитать за Декабрь'}
              </button>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-green-900 mb-2">Импорт Данных</h4>
              <p className="text-sm text-green-700 mb-3">Загрузить данные из Google Drive папок сотрудников</p>
              
              {/* Статус авторизации */}
              <div className="mb-3">
                {googleAuthStatus === 'checking' && (
                  <span className="text-xs text-gray-500">🔄 Проверка авторизации...</span>
                )}
                {googleAuthStatus === 'authenticated' && (
                  <div>
                    <span className="text-xs text-green-600">✅ Google Drive подключен</span>
                    {googleInfo && (
                      <div className="text-xs text-gray-600 mt-1">
                        📁 {googleInfo.folderName || 'Junior папка'} | 👥 {googleInfo.employeeFolders || 0} сотрудников
                      </div>
                    )}
                  </div>
                )}
                {googleAuthStatus === 'not_authenticated' && (
                  <span className="text-xs text-red-600">❌ Требуется авторизация Google</span>
                )}
                {googleAuthStatus === 'error' && (
                  <span className="text-xs text-orange-600">⚠️ Ошибка проверки авторизации</span>
                )}
              </div>

              <div className="space-y-2">
                {googleAuthStatus === 'not_authenticated' ? (
                  <button 
                    onClick={() => window.location.href = '/api/auth/google'}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 w-full"
                  >
                    🔗 Подключить Google Drive
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => importFromSheets()}
                      disabled={loading || googleAuthStatus !== 'authenticated'}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 w-full"
                    >
                      {loading ? 'Импорт...' : '📥 Импортировать данные'}
                    </button>
                    <button 
                      onClick={() => testGoogleConnection()}
                      disabled={loading}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50 w-full"
                    >
                      {loading ? 'Проверка...' : '🔍 Тест подключения'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-purple-900 mb-2">Экспорт Отчета</h4>
              <p className="text-sm text-purple-700 mb-3">Создать отчет по всем сотрудникам</p>
              <button 
                onClick={() => exportReport()}
                disabled={loading}
                className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                Скачать Отчет
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-700 mb-4">Partnership Requests</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-700 mb-4">Job Applications</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                HR & Utilizatori
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'casinos' && renderCasinos()}
        {activeSection === 'users' && renderUsers()}
        {activeSection === 'reports' && renderReports()}
      </main>
    </div>
  )
}
