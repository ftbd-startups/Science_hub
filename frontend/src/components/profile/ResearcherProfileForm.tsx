import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, MapPin, GraduationCap, Briefcase, Plus, X, Link } from 'lucide-react'
import { ResearcherProfile } from '@/types/database'
import { useUpdateResearcherProfile } from '@/hooks/useProfile'
import { cn } from '@/lib/utils'

const researcherProfileSchema = z.object({
  first_name: z.string().min(1, 'Имя обязательно'),
  last_name: z.string().min(1, 'Фамилия обязательна'),
  bio: z.string().optional(),
  specialization: z.array(z.string()).optional(),
  education: z.string().optional(),
  experience_years: z.number().min(0, 'Опыт не может быть отрицательным').optional(),
  location: z.string().optional(),
  portfolio_url: z.string().url('Введите корректный URL').optional().or(z.literal('')),
})

type ResearcherProfileFormData = z.infer<typeof researcherProfileSchema>

interface ResearcherProfileFormProps {
  profile?: ResearcherProfile | null
  onSuccess?: () => void
  className?: string
}

const commonSpecializations = [
  'Искусственный интеллект',
  'Машинное обучение',
  'Биоинформатика',
  'Квантовые вычисления',
  'Нанотехнологии',
  'Биотехнологии',
  'Материаловедение',
  'Энергетика',
  'Экология',
  'Медицина',
  'Фармакология',
  'Химия',
  'Физика',
  'Математика',
  'Статистика',
  'Другое'
]

export function ResearcherProfileForm({ profile, onSuccess, className }: ResearcherProfileFormProps) {
  const updateProfile = useUpdateResearcherProfile()
  const [customSpecialization, setCustomSpecialization] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
    setError
  } = useForm<ResearcherProfileFormData>({
    resolver: zodResolver(researcherProfileSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      bio: profile?.bio || '',
      specialization: profile?.specialization || [],
      education: profile?.education || '',
      experience_years: profile?.experience_years || undefined,
      location: profile?.location || '',
      portfolio_url: profile?.portfolio_url || '',
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'specialization'
  })

  const watchedSpecializations = watch('specialization') || []

  const addSpecialization = (spec: string) => {
    if (spec && !watchedSpecializations.includes(spec)) {
      append(spec)
    }
  }

  const addCustomSpecialization = () => {
    if (customSpecialization.trim() && !watchedSpecializations.includes(customSpecialization.trim())) {
      append(customSpecialization.trim())
      setCustomSpecialization('')
    }
  }

  const onSubmit = async (data: ResearcherProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data)
      onSuccess?.()
    } catch (error: any) {
      setError('root', {
        message: error.message || 'Ошибка при сохранении профиля'
      })
    }
  }

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <User className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Профиль исследователя
            </h2>
            <p className="text-sm text-gray-600">
              Заполните информацию о себе и своих компетенциях
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {(updateProfile.error || errors.root) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">
                {updateProfile.error?.message || errors.root?.message}
              </p>
            </div>
          )}

          {updateProfile.isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">
                Профиль успешно сохранен!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                Имя *
              </label>
              <input
                id="first_name"
                type="text"
                {...register('first_name')}
                className={cn(
                  'input mt-1',
                  errors.first_name && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="Иван"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Фамилия *
              </label>
              <input
                id="last_name"
                type="text"
                {...register('last_name')}
                className={cn(
                  'input mt-1',
                  errors.last_name && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="Иванов"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              О себе
            </label>
            <textarea
              id="bio"
              rows={4}
              {...register('bio')}
              className="input mt-1"
              placeholder="Расскажите о своем опыте, интересах и достижениях..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Специализации
            </label>
            
            {/* Selected specializations */}
            {fields.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {fields.map((field, index) => (
                  <span
                    key={field.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {field.value}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Common specializations */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {commonSpecializations.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => addSpecialization(spec)}
                  disabled={watchedSpecializations.includes(spec)}
                  className={cn(
                    'text-left px-3 py-2 text-sm rounded-md border transition-colors',
                    watchedSpecializations.includes(spec)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                  )}
                >
                  {spec}
                </button>
              ))}
            </div>

            {/* Custom specialization */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSpecialization}
                onChange={(e) => setCustomSpecialization(e.target.value)}
                placeholder="Добавить свою специализацию"
                className="input flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomSpecialization()
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomSpecialization}
                className="btn-outline px-3 py-2"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="education" className="block text-sm font-medium text-gray-700">
                <GraduationCap className="inline h-4 w-4 mr-1" />
                Образование
              </label>
              <input
                id="education"
                type="text"
                {...register('education')}
                className="input mt-1"
                placeholder="МГУ, кандидат физико-математических наук"
              />
            </div>

            <div>
              <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700">
                <Briefcase className="inline h-4 w-4 mr-1" />
                Опыт работы (лет)
              </label>
              <input
                id="experience_years"
                type="number"
                min="0"
                {...register('experience_years', { valueAsNumber: true })}
                className={cn(
                  'input mt-1',
                  errors.experience_years && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="5"
              />
              {errors.experience_years && (
                <p className="mt-1 text-sm text-red-600">{errors.experience_years.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                <MapPin className="inline h-4 w-4 mr-1" />
                Местоположение
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                className="input mt-1"
                placeholder="Москва, Россия"
              />
            </div>

            <div>
              <label htmlFor="portfolio_url" className="block text-sm font-medium text-gray-700">
                <Link className="inline h-4 w-4 mr-1" />
                Портфолио/Сайт
              </label>
              <input
                id="portfolio_url"
                type="url"
                {...register('portfolio_url')}
                className={cn(
                  'input mt-1',
                  errors.portfolio_url && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="https://myportfolio.com"
              />
              {errors.portfolio_url && (
                <p className="mt-1 text-sm text-red-600">{errors.portfolio_url.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="submit"
              disabled={updateProfile.isPending || !isDirty}
              className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateProfile.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Сохранение...
                </div>
              ) : (
                'Сохранить профиль'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 