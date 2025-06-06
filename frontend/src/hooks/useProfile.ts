import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { CompanyProfile, ResearcherProfile } from '@/types/database'

export function useCreateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (role: 'company' | 'researcher') => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create profile')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    }
  })
}

export function useCompanyProfile(userId?: string) {
  return useQuery({
    queryKey: ['company-profile', userId],
    queryFn: async () => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return data as CompanyProfile | null
    },
    enabled: !!userId
  })
}

export function useResearcherProfile(userId?: string) {
  return useQuery({
    queryKey: ['researcher-profile', userId],
    queryFn: async () => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .from('researcher_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return data as ResearcherProfile | null
    },
    enabled: !!userId
  })
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (updates: Partial<CompanyProfile>) => {
      const { user } = useAuthStore.getState()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('company_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile'] })
    }
  })
}

export function useUpdateResearcherProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (updates: Partial<ResearcherProfile>) => {
      const { user } = useAuthStore.getState()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('researcher_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researcher-profile'] })
    }
  })
}

// Hook to get current user's profile based on their role
export function useCurrentUserProfile() {
  const { user } = useAuthStore()
  
  const companyProfileQuery = useCompanyProfile(
    user?.role === 'company' ? user.id : undefined
  )
  
  const researcherProfileQuery = useResearcherProfile(
    user?.role === 'researcher' ? user.id : undefined
  )

  if (user?.role === 'company') {
    return {
      profile: companyProfileQuery.data,
      isLoading: companyProfileQuery.isLoading,
      error: companyProfileQuery.error,
      refetch: companyProfileQuery.refetch
    }
  }

  if (user?.role === 'researcher') {
    return {
      profile: researcherProfileQuery.data,
      isLoading: researcherProfileQuery.isLoading,
      error: researcherProfileQuery.error,
      refetch: researcherProfileQuery.refetch
    }
  }

  return {
    profile: null,
    isLoading: false,
    error: null,
    refetch: () => {}
  }
}

// Hook to check if user needs to complete their profile
export function useProfileCompletion() {
  const { user } = useAuthStore()
  const { profile, isLoading } = useCurrentUserProfile()
  
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)

  useEffect(() => {
    if (!user || isLoading) {
      setNeedsProfileSetup(false)
      return
    }

    if (!profile) {
      setNeedsProfileSetup(true)
      return
    }

    // Check if profile is incomplete
    if (user.role === 'company') {
      const companyProfile = profile as CompanyProfile
      setNeedsProfileSetup(!companyProfile.company_name)
    } else if (user.role === 'researcher') {
      const researcherProfile = profile as ResearcherProfile
      setNeedsProfileSetup(!researcherProfile.first_name || !researcherProfile.last_name)
    }
  }, [user, profile, isLoading])

  return { needsProfileSetup, isLoading }
} 