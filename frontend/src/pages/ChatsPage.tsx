import React from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Clock, User, Building2 } from 'lucide-react'
import { useChats, useChatsRealtime } from '../hooks/useChats'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

const ChatsPage: React.FC = () => {
  const { user } = useAuthStore()
  const { data: chats, isLoading, error } = useChats()
  
  // Подписываемся на realtime обновления чатов
  useChatsRealtime()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Ошибка загрузки</h3>
            <p className="text-red-600">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: ru 
    })
  }

  const getOtherPartyInfo = (chat: any) => {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Чаты</h1>
          <p className="text-gray-600">
            Общайтесь с {user?.role === 'company' ? 'исследователями' : 'компаниями'} по принятым заявкам
          </p>
        </div>

        {!chats || chats.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет активных чатов</h3>
            <p className="text-gray-500 mb-6">
              {user?.role === 'company' 
                ? 'Чаты появятся после принятия заявок на ваши проекты'
                : 'Чаты появятся после принятия ваших заявок компаниями'
              }
            </p>
            <Link
              to={user?.role === 'company' ? '/applications' : '/projects'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {user?.role === 'company' ? 'Посмотреть заявки' : 'Найти проекты'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => {
              const otherParty = getOtherPartyInfo(chat)
              const lastMessage = chat.last_message
              const projectTitle = chat.applications?.projects?.title

              return (
                <Link
                  key={chat.id}
                  to={`/chats/${chat.id}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Аватар */}
                      <div className="flex-shrink-0">
                        {otherParty.avatar ? (
                          <img
                            src={otherParty.avatar}
                            alt={otherParty.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            {otherParty.type === 'company' ? (
                              <Building2 className="w-6 h-6 text-gray-400" />
                            ) : (
                              <User className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Информация о чате */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {otherParty.name}
                          </h3>
                          {lastMessage && (
                            <span className="text-sm text-gray-500 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTime(lastMessage.created_at)}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 mb-2">
                          {otherParty.subtitle} • {projectTitle}
                        </p>

                        {lastMessage ? (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate max-w-md">
                              {lastMessage.message_type === 'file' ? (
                                <span className="flex items-center">
                                  📎 Файл
                                </span>
                              ) : (
                                lastMessage.content
                              )}
                            </p>
                            {chat.unread_count && chat.unread_count > 0 && (
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                                {chat.unread_count}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            Чат создан, начните общение
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Статус чата */}
                    <div className="mt-4 flex items-center justify-between">
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
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          chat.applications?.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          Заявка принята
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatsPage 