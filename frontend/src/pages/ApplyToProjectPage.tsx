import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useProject } from '../hooks/useProjects'
import { useCreateApplication } from '../hooks/useApplications'
import { useAuthStore } from '../store/authStore'

const applicationSchema = z.object({
  cover_letter: z.string().min(1, 'Сопроводительное письмо обязательно').max(2000, 'Слишком длинное письмо'),
  proposed_timeline: z.string().optional(),
  proposed_budget: z.number().min(0, 'Бюджет не может быть отрицательным').optional().nullable()
})

type ApplicationFormData = z.infer<typeof applicationSchema>

const ApplyToProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(id!)
  const { profile } = useAuthStore()
  const createApplicationMutation = useCreateApplication()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema)
  })

  const onSubmit = async (data: ApplicationFormData) => {
    if (!project) return

    try {
      await createApplicationMutation.mutateAsync({
        project_id: project.id,
        cover_letter: data.cover_letter,
        proposed_timeline: data.proposed_timeline || undefined,
        proposed_budget: data.proposed_budget || undefined
      })
      
      navigate('/applications')
    } catch (error) {
      console.error('Error creating application:', error)
    }
  }

  const handleCancel = () => {
    navigate(`/projects/${id}`)
  }

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Бюджет не указан'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `от $${min.toLocaleString()}`
    if (max) return `до $${max.toLocaleString()}`
  }

  if (profile?.user_type !== 'researcher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Доступ запрещен
          </div>
          <p className="text-gray-600 mb-4">
            Только исследователи могут подавать заявки на проекты
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            К проектам
          </Link>
        </div>
      </div>
    )
  }

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
            К проектам
          </Link>
        </div>
      </div>
    )
  }

  if (project.status !== 'published') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-500 text-lg font-medium mb-2">
            Проект недоступен
          </div>
          <p className="text-gray-600 mb-4">
            Этот проект еще не опубликован или больше не принимает заявки
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            К проектам
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Навигация */}
        <div className="mb-8">
          <Link
            to={`/projects/${id}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Назад к проекту
          </Link>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Подать заявку</h1>
          <p className="mt-2 text-gray-600">
            Заявка на участие в проекте "{project.title}"
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Информация о проекте */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">О проекте</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Компания</h4>
                  <p className="text-gray-600">{project.companies?.name}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Бюджет</h4>
                  <p className="text-gray-600">{formatBudget(project.budget_min, project.budget_max)}</p>
                </div>

                {project.deadline && (
                  <div>
                    <h4 className="font-medium text-gray-700">Дедлайн</h4>
                    <p className="text-gray-600">
                      {new Date(project.deadline).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {project.skills_required && project.skills_required.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Требуемые навыки</h4>
                    <div className="flex flex-wrap gap-1">
                      {project.skills_required.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Форма заявки */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Сопроводительное письмо */}
                  <div>
                    <label htmlFor="cover_letter" className="block text-sm font-medium text-gray-700 mb-1">
                      Сопроводительное письмо *
                    </label>
                    <textarea
                      {...register('cover_letter')}
                      id="cover_letter"
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Расскажите о своем опыте, мотивации и том, почему вы подходите для этого проекта..."
                    />
                    {errors.cover_letter && (
                      <p className="mt-1 text-sm text-red-600">{errors.cover_letter.message}</p>
                    )}
                  </div>

                  {/* Предлагаемые сроки */}
                  <div>
                    <label htmlFor="proposed_timeline" className="block text-sm font-medium text-gray-700 mb-1">
                      Предлагаемые сроки выполнения
                    </label>
                    <textarea
                      {...register('proposed_timeline')}
                      id="proposed_timeline"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Опишите примерные сроки выполнения проекта..."
                    />
                  </div>

                  {/* Предлагаемый бюджет */}
                  <div>
                    <label htmlFor="proposed_budget" className="block text-sm font-medium text-gray-700 mb-1">
                      Предлагаемый бюджет ($)
                    </label>
                    <input
                      {...register('proposed_budget', { 
                        valueAsNumber: true,
                        setValueAs: (value) => value === '' ? null : Number(value)
                      })}
                      type="number"
                      id="proposed_budget"
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ваша цена за проект"
                    />
                    {errors.proposed_budget && (
                      <p className="mt-1 text-sm text-red-600">{errors.proposed_budget.message}</p>
                    )}
                  </div>

                  {/* Кнопки */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={createApplicationMutation.isPending}
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={createApplicationMutation.isPending}
                    >
                      {createApplicationMutation.isPending ? 'Отправка...' : 'Подать заявку'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Советы */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                💡 Советы для успешной заявки
              </h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• Подробно опишите свой релевантный опыт и достижения</li>
                <li>• Покажите понимание задач и требований проекта</li>
                <li>• Предложите реалистичные сроки и бюджет</li>
                <li>• Приложите ссылки на портфолио или предыдущие работы</li>
                <li>• Будьте конкретны и профессиональны</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplyToProjectPage 