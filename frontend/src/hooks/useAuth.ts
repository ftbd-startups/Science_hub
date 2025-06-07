import { useAuthStore } from '../store/authStore'

// Export useAuth hook for compatibility
export const useAuth = () => {
  const { user } = useAuthStore()
  return { user, profile: null }
} 