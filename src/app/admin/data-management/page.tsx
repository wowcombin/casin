'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Employee {
  id: number
  nickname: string
  role: string
  isActive: boolean
  workData: WorkData[]
  testResults: TestResult[]
}

interface WorkData {
  id: number
  month: string
  casino: string
  deposit: number
  withdrawal: number
  card: string
  createdAt: string
}

interface TestResult {
  id: number
  month: string
  casino: string
  deposit: number
  withdrawal: number
  card: string
  createdAt: string
}

interface ImportProgress {
  step: string
  current: number
  total: number
  message: string
}

export default function DataManagementPage() {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [activeTab, setActiveTab] = useState('view')
  const [newData, setNewData] = useState({
    employeeNickname: '',
    month: '',
    casino: '',
    deposit: '',
    withdrawal: '',
    card: '',
    type: 'work' // work или test
  })
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged_in')
    if (!isLoggedIn) {
      router.push('/admin/login')
      return
    }

    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    setSelectedMonth(currentMonth)
    
    loadEmployees()
  }, [router])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/hr/employees')
      const result = await response.json()
      
      if (result.success) {
        setEmployees(result.data)
      } else {
        alert('Ошибка загрузки сотрудников: ' + result.error)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      alert('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const startImport = async () => {
    if (!selectedMonth) {
      alert('Выберите месяц для импорта')
      return
    }

    setLoading(true)
    setImportProgress({
      step: 'Начало импорта',
      current: 0,
      total: 100,
      message: 'Подключение к Google Drive...'
    })

    try {
      // Проверка авторизации
      setImportProgress({
        step: 'Проверка авторизации',
        current: 10,
        total: 100,
        message: 'Проверяем доступ к Google Drive...'
      })

      const authResponse = await fetch('/api/hr/import-sheets')
      const authResult = await authResponse.json()

      if (!authResult.success) {
        if (authResult.needsAuth) {
          const confirmAuth = window.confirm('Требуется авторизация Google Drive. Перейти к авторизации?')
          if (confirmAuth) {
            window.location.href = '/api/auth/google'
            return
          } else {
            setImportProgress(null)
            setLoading(false)
            return
          }
        }
        throw new Error(authResult.error)
      }

      // Начинаем импорт
      setImportProgress({
        step: 'Импорт данных',
        current: 30,
        total: 100,
        message: `Импортируем данные за ${selectedMonth}...`
      })

      const importResponse = await fetch('/api/hr/import-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      })

      const importResult = await importResponse.json()

      setImportProgress({
        step: 'Обработка',
        current: 80,
        total: 100,
        message: 'Обрабатываем импортированные данные...'
      })

      // Небольшая задержка для показа прогресса
      setTimeout(() => {
        setImportProgress({
          step: 'Завершение',
          current: 100,
          total: 100,
          message: importResult.success ? 'Импорт завершен успешно!' : 'Ошибка импорта'
        })

        setTimeout(() => {
          setImportProgress(null)
          if (importResult.success) {
            alert(`✅ Импорт завершен!\n\n${importResult.data.message}`)
            loadEmployees() // Перезагружаем данные
          } else {
            alert(`❌ Ошибка импорта:\n\n${importResult.error}`)
          }
        }, 1000)
      }, 1000)

    } catch (error: any) {
      console.error('Import error:', error)
      setImportProgress(null)
      alert(`❌ Ошибка импорта: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addDataManually = async () => {
    if (!newData.employeeNickname || !newData.month || !newData.casino) {
      alert('Заполните обязательные поля: Сотрудник, Месяц, Казино')
      return
    }

    try {
      setLoading(true)

      // Сначала создаем или находим сотрудника
      let employee = employees.find(emp => emp.nickname === newData.employeeNickname)
      
      if (!employee) {
        const createEmployeeResponse = await fetch('/api/hr/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: newData.employeeNickname,
            role: newData.type === 'test' ? 'TESTER' : 'JUNIOR'
          })
        })
        
        const createEmployeeResult = await createEmployeeResponse.json()
        if (!createEmployeeResult.success) {
          throw new Error(createEmployeeResult.error)
        }
      }

      // Добавляем данные
      const endpoint = newData.type === 'work' ? '/api/hr/work-data' : '/api/hr/test-data'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeNickname: newData.employeeNickname,
          month: newData.month,
          casino: newData.casino,
          deposit: parseFloat(newData.deposit) || 0,
          withdrawal: parseFloat(newData.withdrawal) || 0,
          card: newData.card || 'N/A'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert('✅ Данные добавлены успешно!')
        setNewData({
          employeeNickname: '',
          month: '',
          casino: '',
          deposit: '',
          withdrawal: '',
          card: '',
          type: 'work'
        })
        loadEmployees()
      } else {
        alert('❌ Ошибка добавления: ' + result.error)
      }

    } catch (error: any) {
      console.error('Error adding data:', error)
      alert('❌ Ошибка добавления данных: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

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

  const renderImportTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Импорт из Google Drive</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Месяц для импорта
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={loading}
            >
              <option value="">Выберите месяц</option>
              {generateMonthOptions().map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          {importProgress && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">{importProgress.step}</span>
                <span className="text-sm text-blue-600">{importProgress.current}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress.current}%` }}
                ></div>
              </div>
              <p className="text-sm text-blue-700 mt-2">{importProgress.message}</p>
            </div>
          )}

          <button
            onClick={startImport}
            disabled={loading || !selectedMonth}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {loading ? 'Импортируем...' : '📥 Начать импорт'}
          </button>
        </div>
      </div>
    </div>
  )

  const renderAddDataTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Добавить данные вручную</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип данных *
            </label>
            <select
              value={newData.type}
              onChange={(e) => setNewData({...newData, type: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="work">Рабочие данные</option>
              <option value="test">Тестовые данные</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nickname сотрудника *
            </label>
            <input
              type="text"
              value={newData.employeeNickname}
              onChange={(e) => setNewData({...newData, employeeNickname: e.target.value})}
              placeholder="@username"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Месяц *
            </label>
            <select
              value={newData.month}
              onChange={(e) => setNewData({...newData, month: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Выберите месяц</option>
              {generateMonthOptions().map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Казино *
            </label>
            <input
              type="text"
              value={newData.casino}
              onChange={(e) => setNewData({...newData, casino: e.target.value})}
              placeholder="Название казино"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Депозит
            </label>
            <input
              type="number"
              step="0.01"
              value={newData.deposit}
              onChange={(e) => setNewData({...newData, deposit: e.target.value})}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Вывод
            </label>
            <input
              type="number"
              step="0.01"
              value={newData.withdrawal}
              onChange={(e) => setNewData({...newData, withdrawal: e.target.value})}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Карта
            </label>
            <input
              type="text"
              value={newData.card}
              onChange={(e) => setNewData({...newData, card: e.target.value})}
              placeholder="****1234"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={addDataManually}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {loading ? 'Добавляем...' : '➕ Добавить данные'}
          </button>
        </div>
      </div>
    </div>
  )

  const renderViewDataTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Импортированные данные</h3>
          <button
            onClick={loadEmployees}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : '🔄 Обновить'}
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Нет данных для отображения</p>
            <p className="text-sm text-gray-400 mt-2">Импортируйте данные или добавьте вручную</p>
          </div>
        ) : (
          <div className="space-y-6">
            {employees.map((employee) => (
              <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900">{employee.nickname}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      employee.role === 'TESTER' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {employee.role}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                </div>

                {employee.workData.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Рабочие данные ({employee.workData.length})</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1 text-left">Месяц</th>
                            <th className="px-2 py-1 text-left">Казино</th>
                            <th className="px-2 py-1 text-left">Депозит</th>
                            <th className="px-2 py-1 text-left">Вывод</th>
                            <th className="px-2 py-1 text-left">Карта</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employee.workData.slice(0, 3).map((data) => (
                            <tr key={data.id}>
                              <td className="px-2 py-1">{data.month}</td>
                              <td className="px-2 py-1">{data.casino}</td>
                              <td className="px-2 py-1">{data.deposit}</td>
                              <td className="px-2 py-1">{data.withdrawal}</td>
                              <td className="px-2 py-1 font-mono">{data.card}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {employee.workData.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">...и еще {employee.workData.length - 3} записей</p>
                      )}
                    </div>
                  </div>
                )}

                {employee.testResults.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Тестовые данные ({employee.testResults.length})</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-2 py-1 text-left">Месяц</th>
                            <th className="px-2 py-1 text-left">Казино</th>
                            <th className="px-2 py-1 text-left">Депозит</th>
                            <th className="px-2 py-1 text-left">Вывод</th>
                            <th className="px-2 py-1 text-left">Карта</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employee.testResults.slice(0, 3).map((data) => (
                            <tr key={data.id}>
                              <td className="px-2 py-1">{data.month}</td>
                              <td className="px-2 py-1">{data.casino}</td>
                              <td className="px-2 py-1">{data.deposit}</td>
                              <td className="px-2 py-1">{data.withdrawal}</td>
                              <td className="px-2 py-1 font-mono">{data.card}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {employee.testResults.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">...и еще {employee.testResults.length - 3} записей</p>
                      )}
                    </div>
                  </div>
                )}

                {employee.workData.length === 0 && employee.testResults.length === 0 && (
                  <p className="text-sm text-gray-500">Нет данных для этого сотрудника</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (loading && !importProgress && employees.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900">Управление данными</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/accounting')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                📊 Бухгалтерия
              </button>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ← Дашборд
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
              { id: 'view', name: 'Просмотр данных', icon: '📋' },
              { id: 'import', name: 'Импорт из Drive', icon: '📥' },
              { id: 'add', name: 'Добавить вручную', icon: '➕' }
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
        {activeTab === 'view' && renderViewDataTab()}
        {activeTab === 'import' && renderImportTab()}
        {activeTab === 'add' && renderAddDataTab()}
      </div>
    </div>
  )
}
