import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface Review {
  id: string
  application_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  created_at: string
  updated_at: string
  reviewer?: {
    id: string
    email: string
    company_profiles?: {
      company_name: string
      logo_url?: string
    }
    researcher_profiles?: {
      first_name: string
      last_name: string
      avatar_url?: string
    }
  }
  reviewee?: {
    id: string
    email: string
    company_profiles?: {
      company_name: string
      logo_url?: string
    }
    researcher_profiles?: {
      first_name: string
      last_name: string
      avatar_url?: string
    }
  }
  applications?: {
    id: string
    projects?: {
      title: string
    }
  }
}

interface CreateReviewData {
  application_id: string
  reviewee_id: string
  rating: number
  comment?: string
}

interface UpdateReviewData {
  rating?: number
  comment?: string
}

// Получение списка отзывов
export const useReviews = (filters?: { user_id?: string; application_id?: string }) => {
  return useQuery({
    queryKey: ['reviews', filters],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const params = new URLSearchParams()
      if (filters?.user_id) params.append('user_id', filters.user_id)
      if (filters?.application_id) params.append('application_id', filters.application_id)

      const response = await fetch(`/functions/v1/reviews?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch reviews')
      }

      const data = await response.json()
      return data.reviews as Review[]
    },
  })
}

// Получение конкретного отзыва
export const useReview = (reviewId: string) => {
  return useQuery({
    queryKey: ['reviews', reviewId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/functions/v1/reviews/${reviewId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch review')
      }

      const data = await response.json()
      return data.review as Review
    },
    enabled: !!reviewId,
  })
}

// Создание отзыва
export const useCreateReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reviewData: CreateReviewData) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/functions/v1/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create review')
      }

      const data = await response.json()
      return data.review as Review
    },
    onSuccess: (newReview) => {
      // Инвалидируем кэш отзывов
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      
      // Обновляем кэш для конкретного отзыва
      queryClient.setQueryData(['reviews', newReview.id], newReview)
    },
  })
}

// Обновление отзыва
export const useUpdateReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reviewId, data }: { reviewId: string; data: UpdateReviewData }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/functions/v1/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update review')
      }

      const result = await response.json()
      return result.review as Review
    },
    onSuccess: (updatedReview) => {
      // Обновляем кэш для конкретного отзыва
      queryClient.setQueryData(['reviews', updatedReview.id], updatedReview)
      
      // Инвалидируем список отзывов
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

// Удаление отзыва
export const useDeleteReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/functions/v1/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete review')
      }

      return reviewId
    },
    onSuccess: (deletedReviewId) => {
      // Удаляем из кэша конкретный отзыв
      queryClient.removeQueries({ queryKey: ['reviews', deletedReviewId] })
      
      // Инвалидируем список отзывов
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

// Получение отзывов для конкретного пользователя (профиль)
export const useUserReviews = (userId: string) => {
  return useReviews({ user_id: userId })
}

// Получение отзывов для конкретной заявки
export const useApplicationReviews = (applicationId: string) => {
  return useReviews({ application_id: applicationId })
}

// Проверка, может ли пользователь оставить отзыв на заявку
export const useCanReview = (application: any, currentUserId: string) => {
  return useQuery({
    queryKey: ['canReview', application?.id, currentUserId],
    queryFn: async () => {
      if (!application || !currentUserId) return false
      
      // Проверяем статус заявки
      if (application.status !== 'accepted') return false
      
      // Проверяем, является ли пользователь участником заявки
      const companyUserId = application.projects?.companies?.user_id
      const researcherUserId = application.researchers?.user_id
      
      if (currentUserId !== companyUserId && currentUserId !== researcherUserId) {
        return false
      }
      
      // Проверяем, нет ли уже отзыва от этого пользователя
      const existingReviews = await queryClient.fetchQuery({
        queryKey: ['reviews', { application_id: application.id }],
        queryFn: async () => {
          const reviews = await useReviews({ application_id: application.id })
          return reviews.data || []
        }
      })
      
      const hasReviewed = existingReviews?.some(
        (review: Review) => review.reviewer_id === currentUserId
      )
      
      return !hasReviewed
    },
    enabled: !!application && !!currentUserId,
  })
}

export type { Review, CreateReviewData, UpdateReviewData } 