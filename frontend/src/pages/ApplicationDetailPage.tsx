import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { 
  useApplication, 
  useAcceptApplication, 
  useRejectApplication,
  useWithdrawApplication,
  useDeleteApplication
} from '../hooks/useApplications'
import { useChats } from '../hooks/useChats'
import { useAuthStore } from '../store/authStore'

const statusConfig = {
  pending: {
    label: 'Ожидает рассмотрения',
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

const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { data: application, isLoading, error } = useApplication(id!)
  const { data: chats } = useChats()
  
  const acceptMutation = useAcceptApplication()
  const rejectMutation = useRejectApplication()
  const withdrawMutation = useWithdrawApplication()
  const deleteMutation = useDeleteApplication()
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleAccept = async () => {
    if (!application) return
    try {
      await acceptMutation.mutateAsync(application.id)
    } catch (error) {
      console.error('Error accepting application:', error)
    }
  }

  const handleReject = async () => {
    if (!application) return
    try {
      await rejectMutation.mutateAsync(application.id)
    } catch (error) {
      console.error('Error rejecting application:', error)
    }
  }

  const handleWithdraw = async () => {
    if (!application) return
    try {
      await withdrawMutation.mutateAsync(application.id)
    } catch (error) {
      console.error('Error withdrawing application:', error)
    }
  }

  const handleDelete = async () => {
    if (!application) return
    try {
      await deleteMutation.mutateAsync(application.id)
      navigate('/applications')
    } catch (error) {
      console.error('Error deleting application:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Бюджет не указан'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `от $${min.toLocaleString()}`
    if (max) return `до $${max.toLocaleString()}`
  }

  // Определяем права доступа
  const isResearcher = profile?.user_type === 'researcher' && 
                     profile.researcher_id === application?.researcher_id
  const isCompany = profile?.user_type === 'company' && 
                   profile.company_id === application?.projects?.company_id

  // Найти чат для этой заявки
  const relatedChat = chats?.find(chat => chat.application_id === application?.id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Ошибка загрузки заявки
          </div>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Заявка не найдена'}
          </p>
          <Link
            to="/applications"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            К заявкам
          </Link>
        </div>
      </div>
    )
  }

  if (!isResearcher && !isCompany) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Доступ запрещен
          </div>
          <p className="text-gray-600 mb-4">
            У вас нет прав для просмотра этой заявки
          </p>
          <Link
            to="/applications"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            К заявкам
          </Link>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[application.status].icon

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Навигация */}
        <div className="mb-8">
          <Link
            to="/applications"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Назад к заявкам
          </Link>
        </div>

        {/* Заголовок с действиями */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Заявка на проект
              </h1>
              <p className="mt-2 text-gray-600">
                {application.projects?.title}
              </p>
            </div>
            
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[application.status].className}`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {statusConfig[application.status].label}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-8">
            {/* Информация о проекте */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                О проекте
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700">Название</h3>
                  <p className="text-gray-900">{application.projects?.title}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Описание</h3>
                  <p className="text-gray-600">{application.projects?.description}</p>
                </div>
                
                {application.projects?.requirements && (
                  <div>
                    <h3 className="font-medium text-gray-700">Требования</h3>
                    <p className="text-gray-600">{application.projects.requirements}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Компания</h3>
                    <p className="text-gray-600">{application.projects?.companies?.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700">Бюджет</h3>
                    <p className="text-gray-600">
                      {formatBudget(application.projects?.budget_min, application.projects?.budget_max)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Информация об исследователе */}
            {isCompany && application.researchers && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2" />
                  Об исследователе
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    {application.researchers.avatar_url ? (
                      <img
                        src={application.researchers.avatar_url}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {application.researchers.first_name} {application.researchers.last_name}
                      </h3>
                      {application.researchers.specialization && (
                        <p className="text-gray-600">
                          {Array.isArray(application.researchers.specialization) 
                            ? application.researchers.specialization.join(', ')
                            : application.researchers.specialization
                          }
                        </p>
                      )}
                      {application.researchers.experience_years && (
                        <p className="text-sm text-gray-500">
                          Опыт: {application.researchers.experience_years} лет
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {application.researchers.bio && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">О себе</h4>
                      <p className="text-gray-600">{application.researchers.bio}</p>
                    </div>
                  )}
                  
                  {application.researchers.education && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Образование</h4>
                      <p className="text-gray-600">{application.researchers.education}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Детали заявки */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Детали заявки
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Сопроводительное письмо</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{application.cover_letter}</p>
                  </div>
                </div>
                
                {application.proposed_timeline && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Предлагаемые сроки</h3>
                    <p className="text-gray-600">{application.proposed_timeline}</p>
                  </div>
                )}
                
                {application.proposed_budget && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Предлагаемый бюджет</h3>
                    <p className="text-gray-600">${application.proposed_budget.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Боковая панель с действиями */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Действия</h3>
              
              <div className="space-y-4">
                {/* Действия для компании */}
                {isCompany && application.status === 'pending' && (
                  <>
                    <button
                      onClick={handleAccept}
                      disabled={acceptMutation.isPending}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {acceptMutation.isPending ? 'Принятие...' : 'Принять заявку'}
                    </button>
                    
                    <button
                      onClick={handleReject}
                      disabled={rejectMutation.isPending}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {rejectMutation.isPending ? 'Отклонение...' : 'Отклонить заявку'}
                    </button>
                  </>
                )}

                {/* Действия для исследователя */}
                {isResearcher && (
                  <>
                    {application.status === 'pending' && (
                      <button
                        onClick={handleWithdraw}
                        disabled={withdrawMutation.isPending}
                        className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                      >
                        {withdrawMutation.isPending ? 'Отзыв...' : 'Отозвать заявку'}
                      </button>
                    )}
                    
                    {application.status !== 'accepted' && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Удалить заявку
                      </button>
                    )}
                  </>
                )}

                {/* Кнопка чата для принятых заявок */}
                {application.status === 'accepted' && relatedChat && (
                  <Link
                    to={`/chats/${relatedChat.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                    Открыть чат
                  </Link>
                )}

                {/* Кнопка отзыва для принятых заявок */}
                {application.status === 'accepted' && (
                  <Link
                    to={`/applications/${application.id}/review`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                  >
                    <StarIcon className="w-4 h-4 mr-2" />
                    Оставить отзыв
                  </Link>
                )}

                {/* Информация о датах */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span>Подана: {formatDate(application.created_at)}</span>
                  </div>
                  
                  {application.updated_at !== application.created_at && (
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      <span>Обновлена: {formatDate(application.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Модальное окно подтверждения удаления */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">
                  Удалить заявку?
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Это действие нельзя отменить. Заявка будет удалена навсегда.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 mr-2"
                  >
                    {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="mt-3 px-4 py-2 bg-white text-gray-900 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationDetailPage 