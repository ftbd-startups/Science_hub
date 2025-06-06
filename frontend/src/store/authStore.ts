import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { User, UserRole } from '@/types/database'
import type { Session, User as AuthUser } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

interface AuthActions {
  signUp: (email: string, password: string, role: UserRole) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      session: null,
      loading: false,
      error: null,

      // Actions
      signUp: async (email: string, password: string, role: UserRole) => {
        try {
          set({ loading: true, error: null })
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                role: role
              }
            }
          })

          if (error) throw error

          if (data.user && !data.session) {
            // Email confirmation required
            set({ 
              loading: false, 
              error: 'Проверьте вашу почту для подтверждения регистрации' 
            })
            return
          }

          // If auto-confirmed, create profile
          if (data.user && data.session) {
            try {
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-profile`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${data.session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role })
              })

              if (!response.ok) {
                console.error('Failed to create profile:', await response.text())
                // Don't fail the signup process if profile creation fails
                // User can complete profile setup later
              }
            } catch (profileError) {
              console.error('Error creating profile:', profileError)
              // Don't fail the signup process
            }
          }

          set({ loading: false })
        } catch (error: any) {
          set({ 
            loading: false, 
            error: error.message || 'Ошибка при регистрации' 
          })
          throw error
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null })
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (error) throw error

          // Session will be set automatically via the auth listener
          set({ loading: false })
        } catch (error: any) {
          set({ 
            loading: false, 
            error: error.message || 'Ошибка при входе' 
          })
          throw error
        }
      },

      signOut: async () => {
        try {
          set({ loading: true, error: null })
          
          const { error } = await supabase.auth.signOut()
          
          if (error) throw error

          set({ user: null, session: null, loading: false })
        } catch (error: any) {
          set({ 
            loading: false, 
            error: error.message || 'Ошибка при выходе' 
          })
          throw error
        }
      },

      resetPassword: async (email: string) => {
        try {
          set({ loading: true, error: null })
          
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
          })

          if (error) throw error

          set({ 
            loading: false, 
            error: 'Ссылка для сброса пароля отправлена на почту' 
          })
        } catch (error: any) {
          set({ 
            loading: false, 
            error: error.message || 'Ошибка при сбросе пароля' 
          })
          throw error
        }
      },

      updatePassword: async (newPassword: string) => {
        try {
          set({ loading: true, error: null })
          
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          })

          if (error) throw error

          set({ loading: false })
        } catch (error: any) {
          set({ 
            loading: false, 
            error: error.message || 'Ошибка при обновлении пароля' 
          })
          throw error
        }
      },

      setUser: (user: User | null) => set({ user }),
      setSession: (session: Session | null) => set({ session }),
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      initialize: async () => {
        try {
          set({ loading: true })

          // Get initial session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Error getting session:', error)
            set({ loading: false })
            return
          }

          if (session?.user) {
            // Fetch user data from our custom users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (userError) {
              console.error('Error fetching user data:', userError)
            } else {
              set({ user: userData, session })
            }
          }

          set({ loading: false })

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              // Fetch user data
              const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()

              if (!error) {
                set({ user: userData, session })
              }
            } else if (event === 'SIGNED_OUT') {
              set({ user: null, session: null })
            }
          })
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ loading: false })
        }
      }
    }),
    {
      name: 'science-hub-auth',
      partialize: (state) => ({
        user: state.user,
        session: state.session
      })
    }
  )
) 