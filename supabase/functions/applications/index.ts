import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Application {
  id?: string
  project_id: string
  researcher_id: string
  cover_letter: string
  proposed_timeline?: string
  proposed_budget?: number
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
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
    const applicationId = url.pathname.split('/').pop()
    const pathSegments = url.pathname.split('/')
    
    // GET /applications - получить заявки пользователя
    if (req.method === 'GET' && !applicationId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id, researcher_id')
        .eq('id', user.id)
        .single()

      let query = supabase
        .from('applications')
        .select(`
          *,
          projects (
            id,
            title,
            description,
            budget_min,
            budget_max,
            deadline,
            companies (
              name,
              logo_url
            )
          ),
          researchers (
            first_name,
            last_name,
            avatar_url,
            specialization
          )
        `)

      // Если это компания, показываем заявки на её проекты
      if (profile?.user_type === 'company' && profile.company_id) {
        query = query.eq('projects.company_id', profile.company_id)
      }
      // Если это исследователь, показываем его заявки
      else if (profile?.user_type === 'researcher' && profile.researcher_id) {
        query = query.eq('researcher_id', profile.researcher_id)
      }
      else {
        return new Response(
          JSON.stringify({ applications: [] }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: applications, error } = await query.order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ applications }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /applications/:id - получить конкретную заявку
    if (req.method === 'GET' && applicationId) {
      const { data: application, error } = await supabase
        .from('applications')
        .select(`
          *,
          projects (
            id,
            title,
            description,
            requirements,
            budget_min,
            budget_max,
            deadline,
            company_id,
            companies (
              name,
              logo_url,
              industry
            )
          ),
          researchers (
            first_name,
            last_name,
            avatar_url,
            bio,
            specialization,
            education,
            experience_years
          )
        `)
        .eq('id', applicationId)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем права доступа
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id, researcher_id')
        .eq('id', user.id)
        .single()

      const hasAccess = (
        (profile?.user_type === 'researcher' && profile.researcher_id === application.researcher_id) ||
        (profile?.user_type === 'company' && profile.company_id === application.projects?.company_id)
      )

      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ application }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /applications - создать новую заявку
    if (req.method === 'POST') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, researcher_id')
        .eq('id', user.id)
        .single()

      if (profile?.user_type !== 'researcher' || !profile.researcher_id) {
        return new Response(
          JSON.stringify({ error: 'Only researchers can create applications' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const applicationData: Application = await req.json()
      applicationData.researcher_id = profile.researcher_id
      applicationData.status = 'pending'

      // Проверяем, что проект существует и опубликован
      const { data: project } = await supabase
        .from('projects')
        .select('id, status, company_id')
        .eq('id', applicationData.project_id)
        .single()

      if (!project || project.status !== 'published') {
        return new Response(
          JSON.stringify({ error: 'Project not found or not published' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем, нет ли уже заявки от этого исследователя на этот проект
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('project_id', applicationData.project_id)
        .eq('researcher_id', profile.researcher_id)
        .single()

      if (existingApplication) {
        return new Response(
          JSON.stringify({ error: 'You have already applied to this project' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: application, error } = await supabase
        .from('applications')
        .insert([applicationData])
        .select(`
          *,
          projects (
            title,
            companies (
              name
            )
          )
        `)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ application }), 
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /applications/:id - обновить заявку (изменить статус или данные)
    if (req.method === 'PUT' && applicationId) {
      const updateData = await req.json()
      
      // Получаем текущую заявку
      const { data: existingApplication } = await supabase
        .from('applications')
        .select(`
          *,
          projects (
            company_id
          )
        `)
        .eq('id', applicationId)
        .single()

      if (!existingApplication) {
        return new Response(
          JSON.stringify({ error: 'Application not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем права доступа
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id, researcher_id')
        .eq('id', user.id)
        .single()

      const isResearcher = profile?.user_type === 'researcher' && 
                          profile.researcher_id === existingApplication.researcher_id
      const isCompany = profile?.user_type === 'company' && 
                       profile.company_id === existingApplication.projects?.company_id

      if (!isResearcher && !isCompany) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Исследователь может только отозвать заявку или изменить данные до рассмотрения
      if (isResearcher) {
        if (updateData.status && updateData.status !== 'withdrawn') {
          return new Response(
            JSON.stringify({ error: 'Researchers can only withdraw applications' }), 
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        if (existingApplication.status !== 'pending' && updateData.status !== 'withdrawn') {
          return new Response(
            JSON.stringify({ error: 'Cannot modify application after it has been reviewed' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Компания может принять или отклонить заявку
      if (isCompany && updateData.status) {
        if (!['accepted', 'rejected'].includes(updateData.status)) {
          return new Response(
            JSON.stringify({ error: 'Companies can only accept or reject applications' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        if (existingApplication.status !== 'pending') {
          return new Response(
            JSON.stringify({ error: 'Can only review pending applications' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Удаляем поля, которые нельзя изменять
      delete updateData.id
      delete updateData.project_id
      delete updateData.researcher_id
      delete updateData.created_at

      const { data: application, error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)
        .select(`
          *,
          projects (
            title,
            companies (
              name
            )
          ),
          researchers (
            first_name,
            last_name
          )
        `)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ application }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /applications/:id - удалить заявку (только исследователь может удалить свою заявку)
    if (req.method === 'DELETE' && applicationId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, researcher_id')
        .eq('id', user.id)
        .single()

      if (profile?.user_type !== 'researcher') {
        return new Response(
          JSON.stringify({ error: 'Only researchers can delete applications' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем, принадлежит ли заявка этому исследователю
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('researcher_id, status')
        .eq('id', applicationId)
        .single()

      if (existingApplication?.researcher_id !== profile.researcher_id) {
        return new Response(
          JSON.stringify({ error: 'You can only delete your own applications' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (existingApplication.status === 'accepted') {
        return new Response(
          JSON.stringify({ error: 'Cannot delete accepted applications' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Application deleted successfully' }), 
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