import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Globe, MapPin, Users } from 'lucide-react'
import { CompanyProfile } from '@/types/database'
import { useUpdateCompanyProfile } from '@/hooks/useProfile'
import { cn } from '@/lib/utils'

const companyProfileSchema = z.object({
  company_name: z.string().min(1, 'Название компании обязательно'),
  description: z.string().optional(),
  website: z.string().url('Введите корректный URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  location: z.string().optional(),
})

type CompanyProfileFormData = z.infer<typeof companyProfileSchema>

interface CompanyProfileFormProps {
  profile?: CompanyProfile | null
  onSuccess?: () => void
  className?: string
}

const companySizeOptions = [
  { value: '1-10', label: '1-10 сотрудников' },
  { value: '11-50', label: '11-50 сотрудников' },
  { value: '51-200', label: '51-200 сотрудников' },
  { value: '201-500', label: '201-500 сотрудников' },
  { value: '501-1000', label: '501-1000 сотрудников' },
  { value: '1000+', label: 'Более 1000 сотрудников' },
]

const industryOptions = [
  'Информационные технологии',
  'Биотехнологии',
  'Фармацевтика',
  'Энергетика',
  'Машиностроение',
  'Химическая промышленность',
  'Финансы',
  'Образование',
  'Здравоохранение',
  'Другое'
]

export function CompanyProfileForm({ profile, onSuccess, className }: CompanyProfileFormProps) {
  const updateProfile = useUpdateCompanyProfile()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setError
  } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      company_name: profile?.company_name || '',
      description: profile?.description || '',
      website: profile?.website || '',
      industry: profile?.industry || '',
      company_size: profile?.company_size || '',
      location: profile?.location || '',
    }
  })

  const onSubmit = async (data: CompanyProfileFormData) => {
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
          <Building2 className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Профиль компании
            </h2>
            <p className="text-sm text-gray-600">
              Заполните информацию о вашей компании
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

          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
              Название компании *
            </label>
            <input
              id="company_name"
              type="text"
              {...register('company_name')}
              className={cn(
                'input mt-1',
                errors.company_name && 'border-red-300 focus:border-red-500 focus:ring-red-500'
              )}
              placeholder="ООО «Инновационные технологии»"
            />
            {errors.company_name && (
              <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Описание компании
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="input mt-1"
              placeholder="Расскажите о деятельности вашей компании, миссии и ценностях..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                <Globe className="inline h-4 w-4 mr-1" />
                Веб-сайт
              </label>
              <input
                id="website"
                type="url"
                {...register('website')}
                className={cn(
                  'input mt-1',
                  errors.website && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                Отрасль
              </label>
              <select
                id="industry"
                {...register('industry')}
                className="input mt-1"
              >
                <option value="">Выберите отрасль</option>
                {industryOptions.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
                <Users className="inline h-4 w-4 mr-1" />
                Размер компании
              </label>
              <select
                id="company_size"
                {...register('company_size')}
                className="input mt-1"
              >
                <option value="">Выберите размер</option>
                {companySizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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