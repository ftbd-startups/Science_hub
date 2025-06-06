import { useAuthStore } from '@/store/authStore'
import { useCurrentUserProfile } from '@/hooks/useProfile'
import { CompanyProfileForm } from '@/components/profile/CompanyProfileForm'
import { ResearcherProfileForm } from '@/components/profile/ResearcherProfileForm'
import { CompanyProfile, ResearcherProfile } from '@/types/database'

export function ProfilePage() {
  const { user } = useAuthStore()
  const { profile, isLoading, error } = useCurrentUserProfile()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ошибка загрузки профиля
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'Произошла ошибка при загрузке данных профиля'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-4 py-2"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Пользователь не найден
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Мой профиль
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user.email}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {user.role === 'company' ? 'Компания' : 'Исследователь'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {user.role === 'company' ? (
            <CompanyProfileForm 
              profile={profile as CompanyProfile | null}
              onSuccess={() => {
                // Можно добавить уведомление об успешном сохранении
                console.log('Company profile saved successfully')
              }}
            />
          ) : user.role === 'researcher' ? (
            <ResearcherProfileForm 
              profile={profile as ResearcherProfile | null}
              onSuccess={() => {
                // Можно добавить уведомление об успешном сохранении
                console.log('Researcher profile saved successfully')
              }}
            />
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Неизвестная роль пользователя
              </h2>
              <p className="text-gray-600">
                Обратитесь к администратору для решения этой проблемы.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 