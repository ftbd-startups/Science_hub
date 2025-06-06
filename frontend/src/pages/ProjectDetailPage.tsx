import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  BuildingOfficeIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useProject, useDeleteProject } from '../hooks/useProjects'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/utils'

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(id!)
  const { profile } = useAuthStore()
  const deleteProjectMutation = useDeleteProject()

  const isOwnProject = profile?.user_type === 'company' && 
                      profile?.company_id === project?.company_id

  const handleDelete = async () => {
    if (!project || !confirm('Вы действительно хотите удалить этот проект?')) return
    
    try {
      await deleteProjectMutation.mutateAsync(project.id)
      navigate('/projects')
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Бюджет не указан'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `от $${min.toLocaleString()}`
    if (max) return `до $${max.toLocaleString()}`
  }

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return 'Срок не указан'
    const date = new Date(deadline)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Черновик'
      case 'published':
        return 'Опубликован'
      case 'in_progress':
        return 'В работе'
      case 'completed':
        return 'Завершен'
      case 'cancelled':
        return 'Отменен'
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Ошибка загрузки проекта
          </div>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Проект не найден'}
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Вернуться к проектам
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Навигация */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/projects"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Назад к проектам
          </Link>

          {isOwnProject && (
            <div className="flex items-center gap-2">
              <Link
                to={`/projects/${project.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Редактировать
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteProjectMutation.isPending}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                {deleteProjectMutation.isPending ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          )}
        </div>

        {/* Основная информация */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-8">
            {/* Заголовок и статус */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {project.title}
                </h1>
                {project.companies && (
                  <div className="flex items-center text-lg text-gray-600">
                    <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                    {project.companies.name}
                    {project.companies.industry && (
                      <span className="ml-2 text-gray-400">
                        • {project.companies.industry}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                getStatusColor(project.status)
              )}>
                {getStatusText(project.status)}
              </span>
            </div>

            {/* Описание */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Описание проекта</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>

            {/* Требования */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Требования</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {project.requirements}
                </p>
              </div>
            </div>

            {/* Навыки */}
            {project.skills_required && project.skills_required.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Необходимые навыки</h2>
                <div className="flex flex-wrap gap-2">
                  {project.skills_required.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Детали проекта */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Бюджет</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatBudget(project.budget_min, project.budget_max)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-2">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Дедлайн</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDeadline(project.deadline)}
                </p>
              </div>
            </div>

            {/* Действия для исследователей */}
            {profile?.user_type === 'researcher' && project.status === 'published' && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Заинтересованы в участии?</h3>
                    <p className="text-gray-600">Подайте заявку на участие в этом проекте</p>
                  </div>
                  <Link
                    to={`/projects/${project.id}/apply`}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Подать заявку
                  </Link>
                </div>
              </div>
            )}

            {/* Метаинформация */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Создан {new Date(project.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span>
                  Обновлен {new Date(project.updated_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetailPage 