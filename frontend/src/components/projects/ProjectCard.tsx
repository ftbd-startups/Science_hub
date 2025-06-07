import React from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, CurrencyDollarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { Project } from '../../types/database'
import { cn } from '../../lib/utils'

interface ProjectCardProps {
  project: Project
  className?: string
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, className }) => {
  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Бюджет не указан'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `от $${min.toLocaleString()}`
    if (max) return `до $${max.toLocaleString()}`
  }

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return 'Срок не указан'
    const date = new Date(deadline)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Черновик'
      case 'published':
        return 'Опубликован'
      case 'in_progress':
        return 'В работе'
      case 'completed':
        return 'Завершен'
      case 'cancelled':
        return 'Отменен'
      default:
        return status
    }
  }

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200 shadow-sm hover:shadow-md",
      className
    )}>
      <div className="p-6">
        {/* Заголовок и статус */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <Link 
              to={`/projects/${project.id}`}
              className="block hover:text-blue-600 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {project.title}
              </h3>
            </Link>
            {project.companies && (
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                {project.companies.name}
              </div>
            )}
          </div>
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            getStatusColor(project.status)
          )}>
            {getStatusText(project.status)}
          </span>
        </div>

        {/* Описание */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {project.description}
        </p>

        {/* Навыки */}
        {project.skills_required && project.skills_required.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {project.skills_required.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
              {project.skills_required.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  +{project.skills_required.length - 3} еще
                </span>
              )}
            </div>
          </div>
        )}

        {/* Информация о проекте */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <CurrencyDollarIcon className="w-4 h-4 mr-2" />
            {formatBudget(project.budget_min, project.budget_max)}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Дедлайн: {formatDeadline(project.deadline)}
          </div>
        </div>

        {/* Дата создания */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Опубликовано {new Date(project.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard 