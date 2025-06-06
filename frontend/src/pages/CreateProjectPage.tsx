import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useCreateProject } from '../hooks/useProjects'
import ProjectForm from '../components/projects/ProjectForm'

const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate()
  const createProjectMutation = useCreateProject()

  const handleSubmit = async (data: any) => {
    try {
      const project = await createProjectMutation.mutateAsync(data)
      navigate(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const handleCancel = () => {
    navigate('/projects')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Навигация */}
        <div className="mb-8">
          <Link
            to="/projects"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Назад к проектам
          </Link>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Создать новый проект</h1>
          <p className="mt-2 text-gray-600">
            Заполните информацию о проекте, чтобы найти подходящих исследователей
          </p>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-8">
            <ProjectForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={createProjectMutation.isPending}
            />
          </div>
        </div>

        {/* Информационная панель */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            💡 Советы по созданию проекта
          </h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Четко опишите цели и ожидаемые результаты проекта</li>
            <li>• Укажите необходимые навыки и опыт исследователя</li>
            <li>• Установите реалистичный бюджет и временные рамки</li>
            <li>• Сохраните проект как черновик, чтобы доработать его позже</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CreateProjectPage 