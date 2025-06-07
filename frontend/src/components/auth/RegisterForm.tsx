import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
// import { UserRole } from '@/types/database'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: z.string(),
  role: z.enum(['company', 'researcher'] as const, {
    errorMap: () => ({ message: 'Выберите тип аккаунта' })
  }),
  terms: z.boolean().refine(val => val === true, {
    message: 'Необходимо согласие с условиями использования'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword']
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess?: () => void
  className?: string
}

export function RegisterForm({ onSuccess, className }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp, loading, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError: setFormError
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError()
      await signUp(data.email, data.password, data.role)
      onSuccess?.()
    } catch (err: any) {
      setFormError('root', {
        message: err.message || 'Ошибка при регистрации'
      })
    }
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <UserPlus className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Регистрация в Science Hub
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Создайте аккаунт для использования платформы
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(error || errors.root) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">
                {error || errors.root?.message}
              </p>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Тип аккаунта
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="researcher"
                  {...register('role')}
                  className="sr-only"
                />
                <div className={cn(
                  'flex-1 text-center py-3 px-4 rounded-lg border-2 cursor-pointer transition-colors',
                  selectedRole === 'researcher'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}>
                  <div className="text-sm font-medium">Исследователь</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ищу проекты для участия
                  </div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="company"
                  {...register('role')}
                  className="sr-only"
                />
                <div className={cn(
                  'flex-1 text-center py-3 px-4 rounded-lg border-2 cursor-pointer transition-colors',
                  selectedRole === 'company'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}>
                  <div className="text-sm font-medium">Компания</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Размещаю проекты
                  </div>
                </div>
              </label>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={cn(
                'input mt-1',
                errors.email && 'border-red-300 focus:border-red-500 focus:ring-red-500'
              )}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Пароль
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password')}
                className={cn(
                  'input pr-10',
                  errors.password && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Подтвердите пароль
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                className={cn(
                  'input pr-10',
                  errors.confirmPassword && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              {...register('terms')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              Я согласен с{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                условиями использования
              </Link>
              {' '}и{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                политикой конфиденциальности
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-600">{errors.terms.message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Регистрация...
              </div>
            ) : (
              'Зарегистрироваться'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 