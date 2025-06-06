import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Project, ProjectStatus } from '../../types/database'
import { XMarkIcon } from '@heroicons/react/24/outline'

const projectSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200, 'Название слишком длинное'),
  description: z.string().min(1, 'Описание обязательно').max(5000, 'Описание слишком длинное'),
  requirements: z.string().min(1, 'Требования обязательны').max(5000, 'Требования слишком длинные'),
  budget_min: z.number().min(0, 'Минимальный бюджет не может быть отрицательным').optional().nullable(),
  budget_max: z.number().min(0, 'Максимальный бюджет не может быть отрицательным').optional().nullable(),
  deadline: z.string().optional().nullable(),
  skills_required: z.array(z.string()).min(1, 'Укажите хотя бы один навык'),
  status: z.enum(['draft', 'published'] as const)
}).refine((data) => {
  if (data.budget_min && data.budget_max) {
    return data.budget_min <= data.budget_max
  }
  return true
}, {
  message: 'Минимальный бюджет не может быть больше максимального',
  path: ['budget_max']
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: Project
  onSubmit: (data: ProjectFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [skillInput, setSkillInput] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      requirements: project?.requirements || '',
      budget_min: project?.budget_min || null,
      budget_max: project?.budget_max || null,
      deadline: project?.deadline ? project.deadline.split('T')[0] : '',
      skills_required: project?.skills_required || [],
      status: project?.status === 'published' ? 'published' : 'draft'
    }
  })

  const skills = watch('skills_required')

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setValue('skills_required', [...skills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setValue('skills_required', skills.filter(skill => skill !== skillToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Название */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Название проекта *
        </label>
        <input
          {...register('title')}
          type="text"
          id="title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Введите название проекта"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Описание */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Описание проекта *
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Опишите цели и задачи проекта"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Требования */}
      <div>
        <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
          Требования к исполнителю *
        </label>
        <textarea
          {...register('requirements')}
          id="requirements"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Укажите опыт, навыки и квалификацию, необходимые для выполнения проекта"
        />
        {errors.requirements && (
          <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
        )}
      </div>

      {/* Навыки */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Необходимые навыки *
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Введите навык и нажмите Enter"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Добавить
          </button>
        </div>
        
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}
        
        {errors.skills_required && (
          <p className="mt-1 text-sm text-red-600">{errors.skills_required.message}</p>
        )}
      </div>

      {/* Бюджет */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="budget_min" className="block text-sm font-medium text-gray-700 mb-1">
            Минимальный бюджет ($)
          </label>
          <input
            {...register('budget_min', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? null : Number(value)
            })}
            type="number"
            id="budget_min"
            min="0"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
          {errors.budget_min && (
            <p className="mt-1 text-sm text-red-600">{errors.budget_min.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="budget_max" className="block text-sm font-medium text-gray-700 mb-1">
            Максимальный бюджет ($)
          </label>
          <input
            {...register('budget_max', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? null : Number(value)
            })}
            type="number"
            id="budget_max"
            min="0"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
          {errors.budget_max && (
            <p className="mt-1 text-sm text-red-600">{errors.budget_max.message}</p>
          )}
        </div>
      </div>

      {/* Дедлайн */}
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
          Дедлайн
        </label>
        <input
          {...register('deadline')}
          type="date"
          id="deadline"
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.deadline && (
          <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
        )}
      </div>

      {/* Статус */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Статус проекта
        </label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="draft">Черновик</option>
              <option value="published">Опубликовать</option>
            </select>
          )}
        />
        <p className="mt-1 text-sm text-gray-500">
          Черновики видны только вам. Опубликованные проекты видны исследователям.
        </p>
      </div>

      {/* Кнопки */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          Отмена
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Сохранение...' : project ? 'Обновить проект' : 'Создать проект'}
        </button>
      </div>
    </form>
  )
}

export default ProjectForm 