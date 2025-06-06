import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useProject, useUpdateProject } from '../hooks/useProjects'
import { useAuthStore } from '../store/authStore'
import ProjectForm from '../components/projects/ProjectForm'

const EditProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(id!)
  const { profile } = useAuthStore()
  const updateProjectMutation = useUpdateProject()

  const isOwnProject = profile?.user_type === 'company' && 
                      profile?.company_id === project?.company_id

  const handleSubmit = async (data: any) => {
    if (!project) return
    
    try {
      await updateProjectMutation.mutateAsync({ id: project.id, ...data })
      navigate(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  const handleCancel = () => {
    navigate(`/projects/${id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
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

  if (!isOwnProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Доступ запрещен
          </div>
          <p className="text-gray-600 mb-4">
            Вы можете редактировать только свои проекты
          </p>
          <Link
            to={`/projects/${id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Вернуться к проекту
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
          <h1 className="text-3xl font-bold text-gray-900">Редактировать проект</h1>
          <p className="mt-2 text-gray-600">
            Внесите изменения в проект "{project.title}"
          </p>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-8">
            <ProjectForm
              project={project}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={updateProjectMutation.isPending}
            />
          </div>
        </div>

        {/* Предупреждение */}
        {project.status === 'published' && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-900 mb-2">
              ⚠️ Внимание
            </h3>
            <p className="text-yellow-800 text-sm">
              Этот проект уже опубликован и виден исследователям. 
              Изменения могут повлиять на поданные заявки.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditProjectPage 