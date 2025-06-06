import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useAuthStore } from '@/store/authStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleSuccess = () => {
    // После успешной регистрации может потребоваться подтверждение email
    // Поэтому перенаправляем на страницу с инструкциями
    navigate('/email-confirmation', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <RegisterForm onSuccess={handleSuccess} />
    </div>
  )
} 