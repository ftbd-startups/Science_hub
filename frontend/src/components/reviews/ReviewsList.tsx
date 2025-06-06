import React from 'react'
import { Link } from 'react-router-dom'
import { 
  StarIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

import { useUserReviews } from '../../hooks/useReviews'
import { Review } from '../../hooks/useReviews'

interface ReviewsListProps {
  userId: string
  showTitle?: boolean
  maxItems?: number
}

export default function ReviewsList({ userId, showTitle = true, maxItems }: ReviewsListProps) {
  const { data: reviews, isLoading, error } = useUserReviews(userId)

  const displayReviews = maxItems ? reviews?.slice(0, maxItems) : reviews

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

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }

  const renderReviewCard = (review: Review) => {
    const isCompanyReviewer = !!review.reviewer?.company_profiles
    const reviewerName = isCompanyReviewer
      ? review.reviewer?.company_profiles?.company_name
      : `${review.reviewer?.researcher_profiles?.first_name} ${review.reviewer?.researcher_profiles?.last_name}`
    
    const reviewerAvatar = isCompanyReviewer
      ? review.reviewer?.company_profiles?.logo_url
      : review.reviewer?.researcher_profiles?.avatar_url

    return (
      <div key={review.id} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
        <div className="flex items-start space-x-3">
          {/* Аватар рецензента */}
          <div className="flex-shrink-0">
            {reviewerAvatar ? (
              <img
                className={`h-10 w-10 object-cover ${isCompanyReviewer ? 'rounded-lg' : 'rounded-full'}`}
                src={reviewerAvatar}
                alt=""
              />
            ) : isCompanyReviewer ? (
              <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
            ) : (
              <UserCircleIcon className="h-10 w-10 text-gray-400" />
            )}
          </div>

          {/* Содержимое отзыва */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {reviewerName}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {renderStars(review.rating)}
            </div>

            {/* Проект */}
            {review.applications?.projects?.title && (
              <p className="text-xs text-gray-600 mt-1">
                Проект: {review.applications.projects.title}
              </p>
            )}

            {/* Комментарий */}
            {review.comment && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                {review.comment}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        {showTitle && (
          <h3 className="text-lg font-medium text-gray-900 mb-4">Отзывы</h3>
        )}
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="rounded-full bg-gray-300 h-10 w-10"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        {showTitle && (
          <h3 className="text-lg font-medium text-gray-900 mb-4">Отзывы</h3>
        )}
        <div className="text-center text-gray-500">
          <p>Ошибка загрузки отзывов</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Отзывы</h3>
            {reviews && reviews.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {renderStars(calculateAverageRating())}
                  <span className="ml-2 text-sm text-gray-600">
                    ({reviews.length} отзыв{reviews.length > 1 ? 'ов' : ''})
                  </span>
                </div>
                {reviews.length > (maxItems || 0) && (
                  <Link
                    to={`/reviews?user_id=${userId}`}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Все отзывы
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {!displayReviews || displayReviews.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">Нет отзывов</h4>
            <p className="mt-1 text-sm text-gray-500">
              Отзывы появятся после завершения проектов
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayReviews.map(renderReviewCard)}
            
            {maxItems && reviews && reviews.length > maxItems && (
              <div className="pt-4 border-t border-gray-200">
                <Link
                  to={`/reviews?user_id=${userId}`}
                  className="block text-center text-sm text-blue-600 hover:text-blue-500"
                >
                  Показать все {reviews.length} отзыв{reviews.length > 1 ? 'ов' : ''}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 