'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AccountingData {
  month: string
  rate: number
  workData: Array<{
    nickname: string
    casino: string
    card: string
    deposit: number
    withdrawal: number
    calculation: number
  }>
  testData: Array<{
    nickname: string
    casino: string
    card: string
    deposit: number
    withdrawal: number
    calculation: number
  }>
  siteProfits: Array<{
    site: string
    profit: number
  }>
  employeeProfits: Array<{
    nickname: string
    profit: number
  }>
  totalProfit: number
  stats: {
    totalRecords: number
    totalEmployees: number
    totalSites: number
  }
}

export default function AccountingPage() {
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [accountingData, setAccountingData] = useState<AccountingData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged_in')
    if (!isLoggedIn) {
      router.push('/admin/login')
      return
    }

    // Set current month as default
    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    setSelectedMonth(currentMonth)
    setLoading(false)
  }, [router])

  const loadMonthData = async (month: string) => {
    if (!month) return

    setLoading(true)
    setError(null)
    
    try {
      console.log(`Loading data for month: ${month}`)
      const response = await fetch(`/api/hr/monthly-data?month=${encodeURIComponent(month)}`)
      const result = await response.json()

      console.log('API Response:', result)

      if (result.success) {
        setAccountingData(result.data)
      } else {
        console.log('API error:', result.error)
        setError(`Ошибка API: ${result.error}`)
        
        // Показываем пустые данные
        setAccountingData({
          month,
          rate: 1.27,
          workData: [],
          testData: [],
          siteProfits: [],
          employeeProfits: [],
          totalProfit: 0,
          stats: { totalRecords: 0, totalEmployees: 0, totalSites: 0 }
        })
      }
    } catch (error: any) {
      console.error('Error loading data:', error)
      setError(`Ошибка загрузки: ${error.message}`)
      
      // Показываем демо данные при ошибке
      setAccountingData({
        month,
        rate: 1.27,
        workData: [
          { 
            nickname: '@demo_user', 
            casino: 'Demo Casino', 
            card: '****1234', 
            deposit: 100, 
            withdrawal: 150, 
            calculation: 6.35 
          }
        ],
        testData: [
          { 
            nickname: '@sobroffice', 
            casino: 'Test Casino', 
            card: '****5678', 
            deposit: 50, 
            withdrawal: 75, 
            calculation: 3.18 
          }
        ],
        siteProfits: [
          { site: 'Demo Casino', profit: 63.5 },
          { site: 'Test Casino', profit: 31.8 }
        ],
        employeeProfits: [
          { nickname: '@demo_user', profit: 206.35 },
          { nickname: '@sobroffice', profit: 203.18 }
        ],
        totalProfit: 95.3,
        stats: { totalRecords: 2, totalEmployees: 2, totalSites: 2 }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedMonth) {
      loadMonthData(selectedMonth)
    }
  }, [selectedMonth])

  const generateMonthOptions = () => {
    const months = []
    const currentDate = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthStr = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      months.push(monthStr)
    }
    
    return months
  }

  const renderOverview = () => (
    <div>
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                База данных недоступна
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{error}</p>
                <p className="mt-1">Показаны демо данные для тестирования интерфейса.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Общая прибыль</h3>
          <p className="text-3xl font-bold text-green-600">
            ${accountingData?.totalProfit?.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-gray-500">Курс: {accountingData?.rate}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Сотрудников</h3>
          <p className="text-3xl font-bold text-blue-600">
            {accountingData?.stats?.totalEmployees || 0}
          </p>
          <p className="text-sm text-gray-500">Активных</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Казино</h3>
          <p className="text-3xl font-bold text-purple-600">
            {accountingData?.stats?.totalSites || 0}
          </p>
          <p className="text-sm text-gray-500">Всего записей: {accountingData?.stats?.totalRecords || 0}</p>
        </div>
      </div>
    </div>
  )

  const renderAllData = () => (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Все записи за {selectedMonth}
        </h3>
        
        {error && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-700">
              📊 Демо данные - база данных недоступна
            </p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nickname</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Withdrawal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculation</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountingData?.workData?.map((row, index) => (
                <tr key={`work-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.nickname}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.casino}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{row.card}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.deposit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.withdrawal}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.calculation.toFixed(2)}</td>
                </tr>
              ))}
              {accountingData?.testData?.map((row, index) => (
                <tr key={`test-${index}`} className="bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.nickname}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.casino}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{row.card}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.deposit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.withdrawal}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.calculation.toFixed(2)}</td>
                </tr>
              ))}
              {(!accountingData?.workData?.length && !accountingData?.testData?.length) && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Нет данных за выбранный месяц
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderSiteProfits = () => (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Прибыль по сайтам
        </h3>
        
        {error && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-700">
              📊 Демо данные - база данных недоступна
            </p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Profit in USD</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountingData?.siteProfits?.map((site, index) => (
                <tr key={index} className={site.profit < 0 ? 'bg-red-50' : site.profit > 50 ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{site.site}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${site.profit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {site.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
              {accountingData?.siteProfits && accountingData.siteProfits.length > 0 && (
                <tr className="bg-gray-100 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Profit Across All Sites</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {accountingData?.totalProfit?.toFixed(2)}
                  </td>
                </tr>
              )}
              {(!accountingData?.siteProfits?.length) && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                    Нет данных по сайтам за выбранный месяц
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderEmployeeProfits = () => (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Прибыль сотрудников
        </h3>
        
        {error && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-700">
              📊 Демо данные - база данных недоступна
            </p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountingData?.employeeProfits?.map((employee, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.nickname}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {employee.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
              {(!accountingData?.employeeProfits?.length) && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                    Нет данных по сотрудникам за выбранный месяц
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  if (loading && !accountingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Accounting Dashboard</h1>
            <div className="flex items-center space-x-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="">Выберите месяц</option>
                {generateMonthOptions().map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ← Назад
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Обзор', icon: '📊' },
              { id: 'all-data', name: 'Все записи', icon: '📋' },
              { id: 'site-profits', name: 'Прибыль по сайтам', icon: '🎰' },
              { id: 'employee-profits', name: 'Прибыль сотрудников', icon: '👥' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {accountingData ? (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'all-data' && renderAllData()}
            {activeTab === 'site-profits' && renderSiteProfits()}
            {activeTab === 'employee-profits' && renderEmployeeProfits()}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {selectedMonth ? 'Нет данных за выбранный месяц' : 'Выберите месяц для просмотра данных'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
