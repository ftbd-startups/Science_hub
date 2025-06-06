import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { useApplications } from '../hooks/useApplications'
import { useAuthStore } from '../store/authStore'
import { Application } from '../types/database'

const statusConfig = {
  pending: {
    label: 'Ожидает',
    icon: ClockIcon,
    className: 'bg-yellow-100 text-yellow-800'
  },
  accepted: {
    label: 'Принята',
    icon: CheckCircleIcon,
    className: 'bg-green-100 text-green-800'
  },
  rejected: {
    label: 'Отклонена',
    icon: XCircleIcon,
    className: 'bg-red-100 text-red-800'
  },
  withdrawn: {
    label: 'Отозвана',
    icon: ExclamationTriangleIcon,
    className: 'bg-gray-100 text-gray-800'
  }
}

const ApplicationCard: React.FC<{ application: Application }> = ({ application }) => {
  const { profile } = useAuthStore()
  const StatusIcon = statusConfig[application.status].icon

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Бюджет не указан'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `от $${min.toLocaleString()}`
    if (max) return `до $${max.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link 
              to={`/applications/${application.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {application.projects?.title}
            </Link>
            {application.projects?.companies && (
              <p className="text-gray-600 mt-1">
                {application.projects.companies.name}
              </p>
            )}
          </div>
          
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[application.status].className}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig[application.status].label}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-sm text-gray-500">Бюджет проекта:</span>
            <p className="text-sm font-medium text-gray-900">
              {formatBudget(application.projects?.budget_min, application.projects?.budget_max)}
            </p>
          </div>
          
          {application.proposed_budget && (
            <div>
              <span className="text-sm text-gray-500">Ваше предложение:</span>
              <p className="text-sm font-medium text-gray-900">
                ${application.proposed_budget.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {application.cover_letter}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            Подана {formatDate(application.created_at)}
          </div>
          
          <Link
            to={`/applications/${application.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            Подробнее
          </Link>
        </div>
      </div>
    </div>
  )
}

const ApplicationsPage: React.FC = () => {
  const { profile } = useAuthStore()
  const { data: applications, isLoading, error } = useApplications()
  const [statusFilter, setStatusFilter] = useState<'all' | keyof typeof statusConfig>('all')

  const filteredApplications = applications?.filter(app => 
    statusFilter === 'all' || app.status === statusFilter
  ) || []

  const statusCounts = applications?.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Ошибка загрузки заявок
          </div>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile?.user_type === 'researcher' ? 'Мои заявки' : 'Заявки на проекты'}
              </h1>
              <p className="mt-2 text-gray-600">
                {profile?.user_type === 'researcher' 
                  ? 'Управляйте своими заявками на участие в проектах'
                  : 'Рассматривайте заявки исследователей на ваши проекты'
                }
              </p>
            </div>
            
            {profile?.user_type === 'researcher' && (
              <Link
                to="/projects"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Найти проекты
              </Link>
            )}
          </div>
        </div>

        {/* Фильтры */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setStatusFilter('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  statusFilter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Все ({applications?.length || 0})
              </button>
              
              {Object.entries(statusConfig).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as keyof typeof statusConfig)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    statusFilter === status
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {config.label} ({statusCounts[status] || 0})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Список заявок */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {statusFilter === 'all' 
                ? 'Нет заявок' 
                : `Нет заявок со статусом "${statusConfig[statusFilter].label}"`
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {profile?.user_type === 'researcher'
                ? 'Начните подавать заявки на интересные проекты'
                : 'Заявки появятся, когда исследователи заинтересуются вашими проектами'
              }
            </p>
            {profile?.user_type === 'researcher' && (
              <div className="mt-6">
                <Link
                  to="/projects"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Найти проекты
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationsPage 