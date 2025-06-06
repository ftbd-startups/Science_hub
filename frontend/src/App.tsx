import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ProfilePage } from '@/pages/ProfilePage'
import ProjectsPage from '@/pages/ProjectsPage'
import ProjectDetailPage from '@/pages/ProjectDetailPage'
import CreateProjectPage from '@/pages/CreateProjectPage'
import EditProjectPage from '@/pages/EditProjectPage'
import ApplyToProjectPage from '@/pages/ApplyToProjectPage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import ApplicationDetailPage from '@/pages/ApplicationDetailPage'
import ChatsPage from '@/pages/ChatsPage'
import ChatDetailPage from '@/pages/ChatDetailPage'
import ReviewsPage from '@/pages/ReviewsPage'
import CreateReviewPage from '@/pages/CreateReviewPage'

function App() {
  const { initialize, loading, user } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
          
          {/* Защищенные маршруты */}
          <Route path="/" element={
            user ? <DashboardPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/profile" element={
            user ? <ProfilePage /> : <Navigate to="/login" replace />
          } />
          <Route path="/projects" element={
            user ? <ProjectsPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/projects/new" element={
            user ? <CreateProjectPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/projects/:id" element={
            user ? <ProjectDetailPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/projects/:id/edit" element={
            user ? <EditProjectPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/projects/:id/apply" element={
            user ? <ApplyToProjectPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/applications" element={
            user ? <ApplicationsPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/applications/:id" element={
            user ? <ApplicationDetailPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/chats" element={
            user ? <ChatsPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/chats/:chatId" element={
            user ? <ChatDetailPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/reviews" element={
            user ? <ReviewsPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/applications/:applicationId/review" element={
            user ? <CreateReviewPage /> : <Navigate to="/login" replace />
          } />
          
          {/* Перенаправление на главную */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

// Временные компоненты-заглушки
function EmailConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Подтвердите email
        </h2>
        <p className="text-gray-600">
          Мы отправили письмо с ссылкой для подтверждения на ваш email. 
          Проверьте почту и перейдите по ссылке для активации аккаунта.
        </p>
      </div>
    </div>
  )
}

function DashboardPage() {
  const { user, signOut } = useAuthStore()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Science Hub
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Добро пожаловать, {user?.email}!
              </span>
              <a
                href="/projects"
                className="text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Проекты
              </a>
              <a
                href="/applications"
                className="text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Заявки
              </a>
              <a
                href="/chats"
                className="text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Чаты
              </a>
              <a
                href="/reviews"
                className="text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Отзывы
              </a>
              <a
                href="/profile"
                className="text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Профиль
              </a>
              <button
                onClick={signOut}
                className="btn-outline px-4 py-2"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Платформа запущена! 🚀
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Система аутентификации и профилей работает. Роль пользователя: <strong>{user?.role}</strong>
            </p>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Что уже готово:
              </h3>
              <ul className="text-left text-gray-600 space-y-2">
                <li>✅ Регистрация и аутентификация</li>
                <li>✅ Создание и редактирование профилей</li>
                <li>✅ Разделение ролей (компании/исследователи)</li>
                <li>✅ Безопасность на уровне базы данных (RLS)</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Следующие шаги:
              </h3>
              <p className="text-gray-600">
                Создание системы проектов, заявок и коммуникации между пользователями.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}



export default App 