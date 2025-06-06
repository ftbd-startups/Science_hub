import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Project {
  id?: string
  title: string
  description: string
  requirements: string
  budget_min?: number
  budget_max?: number
  deadline?: string
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
  company_id: string
  skills_required: string[]
  created_at?: string
  updated_at?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Получаем авторизованного пользователя
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const projectId = url.pathname.split('/').pop()
    
    // GET /projects - получить все проекты или проекты пользователя
    if (req.method === 'GET' && !projectId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id')
        .eq('id', user.id)
        .single()

      let query = supabase
        .from('projects')
        .select(`
          *,
          companies (
            name,
            logo_url
          )
        `)

      // Если это компания, показываем только её проекты
      if (profile?.user_type === 'company' && profile.company_id) {
        query = query.eq('company_id', profile.company_id)
      }
      // Если это исследователь, показываем только опубликованные проекты
      else if (profile?.user_type === 'researcher') {
        query = query.eq('status', 'published')
      }

      const { data: projects, error } = await query.order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ projects }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /projects/:id - получить конкретный проект
    if (req.method === 'GET' && projectId) {
      const { data: project, error } = await supabase
        .from('projects')
        .select(`
          *,
          companies (
            name,
            logo_url,
            industry
          )
        `)
        .eq('id', projectId)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ project }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /projects - создать новый проект
    if (req.method === 'POST') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id')
        .eq('id', user.id)
        .single()

      if (profile?.user_type !== 'company' || !profile.company_id) {
        return new Response(
          JSON.stringify({ error: 'Only companies can create projects' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const projectData: Project = await req.json()
      projectData.company_id = profile.company_id
      projectData.status = projectData.status || 'draft'

      const { data: project, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ project }), 
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /projects/:id - обновить проект
    if (req.method === 'PUT' && projectId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id')
        .eq('id', user.id)
        .single()

      if (profile?.user_type !== 'company') {
        return new Response(
          JSON.stringify({ error: 'Only companies can update projects' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем, принадлежит ли проект этой компании
      const { data: existingProject } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()

      if (existingProject?.company_id !== profile.company_id) {
        return new Response(
          JSON.stringify({ error: 'You can only update your own projects' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updateData = await req.json()
      delete updateData.id
      delete updateData.company_id
      delete updateData.created_at

      const { data: project, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ project }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /projects/:id - удалить проект
    if (req.method === 'DELETE' && projectId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id')
        .eq('id', user.id)
        .single()

      if (profile?.user_type !== 'company') {
        return new Response(
          JSON.stringify({ error: 'Only companies can delete projects' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем, принадлежит ли проект этой компании
      const { data: existingProject } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()

      if (existingProject?.company_id !== profile.company_id) {
        return new Response(
          JSON.stringify({ error: 'You can only delete your own projects' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Project deleted successfully' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 