import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Application } from '../types/database'
import { useCreateChat } from './useChats'

interface CreateApplicationData {
  project_id: string
  cover_letter: string
  proposed_timeline?: string
  proposed_budget?: number
}

interface UpdateApplicationData extends Partial<CreateApplicationData> {
  id: string
  status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
}

// Получить все заявки пользователя
export const useApplications = () => {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/applications`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch applications')
      }

      const result = await response.json()
      return result.applications as Application[]
    },
  })
}

// Получить конкретную заявку
export const useApplication = (applicationId: string) => {
  return useQuery({
    queryKey: ['applications', applicationId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/applications/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch application')
      }

      const result = await response.json()
      return result.application as Application
    },
    enabled: !!applicationId,
  })
}

// Создать заявку
export const useCreateApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (applicationData: CreateApplicationData) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create application')
      }

      const result = await response.json()
      return result.application as Application
    },
    onSuccess: () => {
      // Обновляем кэш заявок
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

// Обновить заявку
export const useUpdateApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateApplicationData) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update application')
      }

      const result = await response.json()
      return result.application as Application
    },
    onSuccess: (updatedApplication) => {
      // Обновляем кэш заявок
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['applications', updatedApplication.id] })
    },
  })
}

// Удалить заявку
export const useDeleteApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete application')
      }

      return applicationId
    },
    onSuccess: (deletedApplicationId) => {
      // Обновляем кэш заявок
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.removeQueries({ queryKey: ['applications', deletedApplicationId] })
    },
  })
}

// Принять заявку (для компаний)
export const useAcceptApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to accept application')
      }

      const result = await response.json()
      const application = result.application as Application

      // Автоматически создаем чат для принятой заявки
      try {
        const chatResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chats`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ application_id: applicationId }),
        })

        if (chatResponse.ok) {
          // Обновляем кэш чатов если чат создан успешно
          queryClient.invalidateQueries({ queryKey: ['chats'] })
        }
      } catch (error) {
        // Не прерываем процесс если создание чата не удалось
        console.warn('Failed to create chat:', error)
      }

      return application
    },
    onSuccess: (updatedApplication) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['applications', updatedApplication.id] })
    },
  })
}

// Отклонить заявку (для компаний)
export const useRejectApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject application')
      }

      const result = await response.json()
      return result.application as Application
    },
    onSuccess: (updatedApplication) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['applications', updatedApplication.id] })
    },
  })
}

// Отозвать заявку (для исследователей)
export const useWithdrawApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'withdrawn' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to withdraw application')
      }

      const result = await response.json()
      return result.application as Application
    },
    onSuccess: (updatedApplication) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['applications', updatedApplication.id] })
    },
  })
} 