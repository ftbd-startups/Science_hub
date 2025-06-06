import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  StarIcon, 
  ArrowLeftIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

import { useApplication } from '../hooks/useApplications'
import { useCreateReview } from '../hooks/useReviews'
import { useAuth } from '../hooks/useAuth'

const createReviewSchema = z.object({
  rating: z.number().min(1, 'Выберите рейтинг').max(5, 'Максимальный рейтинг 5'),
  comment: z.string().optional()
})

type CreateReviewFormData = z.infer<typeof createReviewSchema>

export default function CreateReviewPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const { data: application, isLoading: applicationLoading } = useApplication(applicationId!)
  const createReviewMutation = useCreateReview()
  
  const [selectedRating, setSelectedRating] = React.useState(0)
  const [hoveredRating, setHoveredRating] = React.useState(0)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CreateReviewFormData>({
    resolver: zodResolver(createReviewSchema)
  })

  const watchedRating = watch('rating')

  React.useEffect(() => {
    if (selectedRating) {
      setValue('rating', selectedRating)
    }
  }, [selectedRating, setValue])

  if (applicationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Заявка не найдена</h2>
          <button
            onClick={() => navigate('/applications')}
            className="text-blue-600 hover:text-blue-500"
          >
            Вернуться к заявкам
          </button>
        </div>
      </div>
    )
  }

  // Определяем кого мы оцениваем
  const isCompanyReviewingResearcher = user?.role === 'company'
  const revieweeUserId = isCompanyReviewingResearcher 
    ? application.researchers?.user_id 
    : application.projects?.companies?.user_id

  const revieweeName = isCompanyReviewingResearcher
    ? `${application.researchers?.first_name} ${application.researchers?.last_name}`
    : application.projects?.companies?.name

  const onSubmit = async (data: CreateReviewFormData) => {
    if (!revieweeUserId) return

    try {
      await createReviewMutation.mutateAsync({
        application_id: applicationId!,
        reviewee_id: revieweeUserId,
        rating: data.rating,
        comment: data.comment
      })
      
      navigate(`/applications/${applicationId}`, {
        state: { message: 'Отзыв успешно создан!' }
      })
    } catch (error) {
      console.error('Failed to create review:', error)
    }
  }

  const renderStarRating = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            onClick={() => setSelectedRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            {(hoveredRating || selectedRating || watchedRating) >= star ? (
              <StarIconSolid className="h-8 w-8 text-yellow-400" />
            ) : (
              <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
            )}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {selectedRating || watchedRating ? `${selectedRating || watchedRating} из 5` : 'Выберите рейтинг'}
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/applications/${applicationId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Назад к заявке
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Оставить отзыв
          </h1>
          <p className="mt-2 text-gray-600">
            Оцените работу с {isCompanyReviewingResearcher ? 'исследователем' : 'компанией'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная форма */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Оценка для {revieweeName}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Рейтинг */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Общая оценка *
                  </label>
                  {renderStarRating()}
                  {errors.rating && (
                    <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
                  )}
                </div>

                {/* Комментарий */}
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Комментарий (необязательно)
                  </label>
                  <textarea
                    id="comment"
                    rows={6}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Поделитесь своим опытом работы..."
                    {...register('comment')}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Опишите качество работы, соблюдение сроков, коммуникацию и другие важные аспекты
                  </p>
                </div>

                {/* Кнопки */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate(`/applications/${applicationId}`)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={createReviewMutation.isPending || !selectedRating}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createReviewMutation.isPending ? 'Сохранение...' : 'Оставить отзыв'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Боковая панель с информацией */}
          <div className="space-y-6">
            {/* Информация о проекте */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">О проекте</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">{application.projects?.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                    {application.projects?.description}
                  </p>
                </div>
                
                {application.projects?.budget_min && application.projects?.budget_max && (
                  <div className="flex items-center text-sm text-gray-600">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    ${application.projects.budget_min.toLocaleString()} - ${application.projects.budget_max.toLocaleString()}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Создано {new Date(application.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>

            {/* Информация о субъекте оценки */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isCompanyReviewingResearcher ? 'Исследователь' : 'Компания'}
              </h3>
              
              <div className="flex items-start space-x-3">
                {isCompanyReviewingResearcher ? (
                  <>
                    {application.researchers?.avatar_url ? (
                      <img
                        className="h-12 w-12 rounded-full object-cover"
                        src={application.researchers.avatar_url}
                        alt=""
                      />
                    ) : (
                      <UserCircleIcon className="h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {application.researchers?.first_name} {application.researchers?.last_name}
                      </p>
                      {application.researchers?.bio && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {application.researchers.bio}
                        </p>
                      )}
                      {application.researchers?.specialization && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {application.researchers.specialization.slice(0, 3).map((spec, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {application.projects?.companies?.logo_url ? (
                      <img
                        className="h-12 w-12 rounded-lg object-cover"
                        src={application.projects.companies.logo_url}
                        alt=""
                      />
                    ) : (
                      <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {application.projects?.companies?.name}
                      </p>
                      {application.projects?.companies?.industry && (
                        <p className="text-sm text-gray-600 mt-1">
                          {application.projects.companies.industry}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Рекомендации */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Советы по написанию отзыва
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Будьте честными и конструктивными</li>
                <li>• Опишите качество работы и коммуникацию</li>
                <li>• Укажите соблюдение сроков</li>
                <li>• Отметьте профессионализм</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 