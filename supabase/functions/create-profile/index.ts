import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { role } = await req.json()

    if (!role || !['company', 'researcher'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update user role
    const { error: userUpdateError } = await supabaseClient
      .from('users')
      .update({ role: role })
      .eq('id', user.id)

    if (userUpdateError) {
      console.error('Error updating user role:', userUpdateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user role' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create profile based on role
    if (role === 'company') {
      const { error: profileError } = await supabaseClient
        .from('company_profiles')
        .insert({
          user_id: user.id,
          company_name: '', // Will be filled during profile setup
          description: '',
          verified: false
        })

      if (profileError) {
        console.error('Error creating company profile:', profileError)
        return new Response(
          JSON.stringify({ error: 'Failed to create company profile' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else if (role === 'researcher') {
      const { error: profileError } = await supabaseClient
        .from('researcher_profiles')
        .insert({
          user_id: user.id,
          first_name: '', // Will be filled during profile setup
          last_name: '',
          bio: '',
          specialization: [],
          verified: false
        })

      if (profileError) {
        console.error('Error creating researcher profile:', profileError)
        return new Response(
          JSON.stringify({ error: 'Failed to create researcher profile' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Profile created successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 