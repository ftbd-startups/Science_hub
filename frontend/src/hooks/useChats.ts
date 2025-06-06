import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Chat, Message } from '../types/database'

interface CreateChatData {
  application_id: string
}

interface SendMessageData {
  chat_id: string
  content: string
  message_type?: 'text' | 'file'
  file_url?: string
}

// Получить все чаты пользователя
export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch chats')
      }

      const result = await response.json()
      return result.chats as Chat[]
    },
  })
}

// Получить конкретный чат с сообщениями
export const useChat = (chatId: string) => {
  return useQuery({
    queryKey: ['chats', chatId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chats/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch chat')
      }

      const result = await response.json()
      return result.chat as Chat
    },
    enabled: !!chatId,
  })
}

// Создать новый чат (автоматически при принятии заявки)
export const useCreateChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (chatData: CreateChatData) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create chat')
      }

      const result = await response.json()
      return result.chat as Chat
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

// Отправить сообщение
export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chat_id, ...messageData }: SendMessageData) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chats/${chat_id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const result = await response.json()
      return result.message as Message
    },
    onSuccess: (message) => {
      // Оптимистично обновляем чат с новым сообщением
      queryClient.setQueryData(['chats', message.chat_id], (oldData: Chat | undefined) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          messages: [...(oldData.messages || []), message],
          updated_at: new Date().toISOString()
        }
      })

      // Обновляем список чатов
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

// Обновить статус чата
export const useUpdateChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chatId, ...updateData }: { chatId: string; [key: string]: any }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update chat')
      }

      const result = await response.json()
      return result.chat as Chat
    },
    onSuccess: (updatedChat) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      queryClient.invalidateQueries({ queryKey: ['chats', updatedChat.id] })
    },
  })
}

// Realtime подписка на новые сообщения в чате
export const useChatRealtime = (chatId: string) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!chatId) return

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          // Получаем полную информацию о сообщении с данными отправителя
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles (
                id,
                user_type,
                companies (
                  name,
                  logo_url
                ),
                researchers (
                  first_name,
                  last_name,
                  avatar_url
                )
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (message) {
            // Обновляем чат с новым сообщением
            queryClient.setQueryData(['chats', chatId], (oldData: Chat | undefined) => {
              if (!oldData) return oldData
              
              return {
                ...oldData,
                messages: [...(oldData.messages || []), message],
                updated_at: payload.new.created_at
              }
            })

            // Обновляем список чатов
            queryClient.invalidateQueries({ queryKey: ['chats'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, queryClient])
}

// Realtime подписка на обновления чатов
export const useChatsRealtime = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          // При любых изменениях в чатах обновляем список
          queryClient.invalidateQueries({ queryKey: ['chats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
} 