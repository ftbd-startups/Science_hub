import React, { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, Paperclip, User, Building2, Clock } from 'lucide-react'
import { useChat, useSendMessage, useChatRealtime } from '../hooks/useChats'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow, format } from 'date-fns'
import { ru } from 'date-fns/locale'

const ChatDetailPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>()
  const { user } = useAuthStore()
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { data: chat, isLoading, error } = useChat(chatId!)
  const sendMessageMutation = useSendMessage()
  
  // Подписываемся на realtime обновления сообщений
  useChatRealtime(chatId!)

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !chatId || isSubmitting) return

    setIsSubmitting(true)
    try {
      await sendMessageMutation.mutateAsync({
        chat_id: chatId,
        content: message.trim(),
        message_type: 'text'
      })
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !chat) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Ошибка загрузки</h3>
            <p className="text-red-600">{error?.message || 'Чат не найден'}</p>
            <Link
              to="/chats"
              className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Вернуться к чатам
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getOtherPartyInfo = () => {
    if (user?.role === 'company') {
      return {
        name: `${chat.applications?.researchers?.first_name} ${chat.applications?.researchers?.last_name}`,
        avatar: chat.applications?.researchers?.avatar_url,
        type: 'researcher' as const,
        subtitle: 'Исследователь'
      }
    } else {
      return {
        name: chat.applications?.projects?.companies?.name || 'Компания',
        avatar: chat.applications?.projects?.companies?.logo_url,
        type: 'company' as const,
        subtitle: 'Компания'
      }
    }
  }

  const otherParty = getOtherPartyInfo()
  const projectTitle = chat.applications?.projects?.title
  const messages = chat.messages || []

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm', { locale: ru })
    } else if (diffInHours < 24 * 7) {
      return format(date, 'EEE HH:mm', { locale: ru })
    } else {
      return format(date, 'dd.MM.yyyy HH:mm', { locale: ru })
    }
  }

  const isMyMessage = (senderId: string) => senderId === user?.id

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Заголовок чата */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/chats"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            
            <div className="flex items-center space-x-3">
              {otherParty.avatar ? (
                <img
                  src={otherParty.avatar}
                  alt={otherParty.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {otherParty.type === 'company' ? (
                    <Building2 className="w-5 h-5 text-gray-400" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              )}
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{otherParty.name}</h1>
                <p className="text-sm text-gray-500">{projectTitle}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              chat.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : chat.status === 'closed'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {chat.status === 'active' ? 'Активный' : 
               chat.status === 'closed' ? 'Закрыт' : 'Архивирован'}
            </span>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Начните общение</h3>
                <p className="text-gray-500">
                  Отправьте первое сообщение для начала диалога с {otherParty.name}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const isMine = isMyMessage(msg.sender_id)
                  const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-xs lg:max-w-md ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                        {/* Аватар */}
                        <div className="flex-shrink-0">
                          {showAvatar && !isMine ? (
                            otherParty.avatar ? (
                              <img
                                src={otherParty.avatar}
                                alt={otherParty.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                {otherParty.type === 'company' ? (
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <User className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            )
                          ) : (
                            <div className="w-8 h-8" />
                          )}
                        </div>

                        {/* Сообщение */}
                        <div className={`${isMine ? 'mr-2' : 'ml-2'}`}>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isMine
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                          >
                            {msg.message_type === 'file' ? (
                              <div className="flex items-center space-x-2">
                                <Paperclip className="w-4 h-4" />
                                <span>Файл</span>
                                {msg.file_url && (
                                  <a
                                    href={msg.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`underline ${isMine ? 'text-blue-100' : 'text-blue-600'}`}
                                  >
                                    Скачать
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>
                          
                          <div className={`mt-1 flex items-center space-x-1 text-xs text-gray-500 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{formatMessageTime(msg.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Форма отправки сообщения */}
          {chat.status === 'active' && (
            <div className="border-t border-gray-200 bg-white px-4 py-4">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    rows={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!message.trim() || isSubmitting}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
              
              <p className="text-xs text-gray-500 mt-2">
                Нажмите Enter для отправки, Shift+Enter для новой строки
              </p>
            </div>
          )}
          
          {chat.status !== 'active' && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 text-center">
              <p className="text-sm text-gray-500">
                Чат {chat.status === 'closed' ? 'закрыт' : 'архивирован'}. Отправка сообщений недоступна.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatDetailPage 