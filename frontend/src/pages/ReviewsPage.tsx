import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { 
  StarIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

import { useReviews } from '../hooks/useReviews'
import { useAuth } from '../hooks/useAuth'
import { Review } from '../hooks/useReviews'

export default function ReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  
  const filterType = searchParams.get('filter') || 'all'
  const userId = searchParams.get('user_id')

  // Определяем фильтры для запроса
  const queryFilters = React.useMemo(() => {
    if (userId) {
      return { user_id: userId }
    }
    
    switch (filterType) {
      case 'received':
        return { user_id: user?.id }
      case 'given':
        return {} // Будем фильтровать на клиенте по reviewer_id
      default:
        return {}
    }
  }, [filterType, userId, user?.id])

  const { data: allReviews, isLoading, error } = useReviews(queryFilters)

  // Фильтруем отзывы на клиенте если нужно
  const filteredReviews = React.useMemo(() => {
    if (!allReviews) return []
    
    if (filterType === 'given') {
      return allReviews.filter(review => review.reviewer_id === user?.id)
    }
    
    return allReviews
  }, [allReviews, filterType, user?.id])

  const setFilter = (filter: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (filter === 'all') {
      newParams.delete('filter')
    } else {
      newParams.set('filter', filter)
    }
    newParams.delete('user_id')
    setSearchParams(newParams)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    )
  }

  const renderReviewCard = (review: Review) => {
    const isUserReviewer = review.reviewer_id === user?.id
    const displayProfile = isUserReviewer ? review.reviewee : review.reviewer
    const isCompanyProfile = !!displayProfile?.company_profiles
    
    const displayName = isCompanyProfile
      ? displayProfile?.company_profiles?.company_name
      : `${displayProfile?.researcher_profiles?.first_name} ${displayProfile?.researcher_profiles?.last_name}`
    
    const avatar = isCompanyProfile
      ? displayProfile?.company_profiles?.logo_url
      : displayProfile?.researcher_profiles?.avatar_url

    return (
      <div key={review.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {/* Аватар */}
              <div className="flex-shrink-0">
                {avatar ? (
                  <img
                    className={`h-12 w-12 object-cover ${isCompanyProfile ? 'rounded-lg' : 'rounded-full'}`}
                    src={avatar}
                    alt=""
                  />
                ) : isCompanyProfile ? (
                  <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
                ) : (
                  <UserCircleIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>

              {/* Основная информация */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {displayName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isUserReviewer ? 'Вы оценили' : 'Оценил вас'}
                    </p>
                  </div>
                  {renderStars(review.rating)}
                </div>

                {/* Проект */}
                {review.applications?.projects?.title && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Проект: <span className="font-medium">{review.applications.projects.title}</span>
                    </p>
                  </div>
                )}

                {/* Комментарий */}
                {review.comment && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {review.comment}
                    </p>
                  </div>
                )}

                {/* Дата и действия */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {new Date(review.created_at).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/applications/${review.application_id}`}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Заявка
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-gray-300 h-12 w-12"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">Не удалось загрузить отзывы</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-500"
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
        {/* Заголовок и фильтры */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">
                {userId ? 'Отзывы пользователя' : 'Отзывы'}
              </h1>
              <p className="mt-2 text-gray-600">
                {userId 
                  ? 'Отзывы о работе пользователя' 
                  : 'Просматривайте и управляйте отзывами'
                }
              </p>
            </div>
          </div>

          {/* Фильтры */}
          {!userId && (
            <div className="mt-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setFilter('all')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      filterType === 'all'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Все отзывы
                  </button>
                  <button
                    onClick={() => setFilter('received')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      filterType === 'received'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Полученные
                  </button>
                  <button
                    onClick={() => setFilter('given')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      filterType === 'given'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Оставленные
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>

        {/* Список отзывов */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет отзывов</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterType === 'received'
                ? 'У вас пока нет полученных отзывов'
                : filterType === 'given'
                ? 'Вы пока не оставляли отзывов'
                : 'Отзывы появятся после завершения проектов'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map(renderReviewCard)}
          </div>
        )}

        {/* Пагинация - можно добавить в будущем */}
        {filteredReviews.length > 0 && (
          <div className="mt-8 flex justify-center">
            <p className="text-sm text-gray-500">
              Показано {filteredReviews.length} отзыв{filteredReviews.length > 1 ? 'ов' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 