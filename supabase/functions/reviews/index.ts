import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CreateReviewData {
  application_id: string
  reviewee_id: string
  rating: number
  comment?: string
}

interface UpdateReviewData {
  rating?: number
  comment?: string
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
    const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0)
    
    // GET /reviews - получить отзывы
    if (req.method === 'GET' && pathSegments.length === 1) {
      const queryParams = new URL(req.url).searchParams
      const userId = queryParams.get('user_id') // Получить отзывы о конкретном пользователе
      const applicationId = queryParams.get('application_id') // Отзывы по конкретной заявке
      
      let query = supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id (
            id,
            email,
            company_profiles (
              company_name,
              logo_url
            ),
            researcher_profiles (
              first_name,
              last_name,
              avatar_url
            )
          ),
          reviewee:reviewee_id (
            id,
            email,
            company_profiles (
              company_name,
              logo_url
            ),
            researcher_profiles (
              first_name,
              last_name,
              avatar_url
            )
          ),
          applications (
            id,
            projects (
              title
            )
          )
        `)

      // Фильтруем по параметрам
      if (userId) {
        query = query.eq('reviewee_id', userId)
      }
      
      if (applicationId) {
        query = query.eq('application_id', applicationId)
      }

      const { data: reviews, error } = await query.order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ reviews }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /reviews/:id - получить конкретный отзыв
    if (req.method === 'GET' && pathSegments.length === 2) {
      const reviewId = pathSegments[1]
      
      const { data: review, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id (
            id,
            email,
            company_profiles (
              company_name,
              logo_url
            ),
            researcher_profiles (
              first_name,
              last_name,
              avatar_url
            )
          ),
          reviewee:reviewee_id (
            id,
            email,
            company_profiles (
              company_name,
              logo_url
            ),
            researcher_profiles (
              first_name,
              last_name,
              avatar_url
            )
          ),
          applications (
            id,
            status,
            projects (
              title,
              companies (
                company_name
              )
            ),
            researchers (
              first_name,
              last_name
            )
          )
        `)
        .eq('id', reviewId)
        .single()

      if (error || !review) {
        return new Response(
          JSON.stringify({ error: 'Review not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ review }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /reviews - создать новый отзыв
    if (req.method === 'POST' && pathSegments.length === 1) {
      const reviewData: CreateReviewData = await req.json()
      
      // Валидация входных данных
      if (!reviewData.application_id || !reviewData.reviewee_id || !reviewData.rating) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: application_id, reviewee_id, rating' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (reviewData.rating < 1 || reviewData.rating > 5) {
        return new Response(
          JSON.stringify({ error: 'Rating must be between 1 and 5' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем, что заявка существует и принята
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          projects (
            company_id,
            companies (
              user_id
            )
          ),
          researchers (
            user_id
          )
        `)
        .eq('id', reviewData.application_id)
        .single()

      if (appError || !application) {
        return new Response(
          JSON.stringify({ error: 'Application not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (application.status !== 'accepted') {
        return new Response(
          JSON.stringify({ error: 'Can only review accepted applications' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем права доступа - только участники заявки могут оставлять отзывы
      const companyUserId = application.projects?.companies?.user_id
      const researcherUserId = application.researchers?.user_id
      
      if (user.id !== companyUserId && user.id !== researcherUserId) {
        return new Response(
          JSON.stringify({ error: 'Access denied. Only application participants can create reviews' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем, что reviewee_id соответствует другому участнику заявки
      if (user.id === companyUserId && reviewData.reviewee_id !== researcherUserId) {
        return new Response(
          JSON.stringify({ error: 'Company can only review the researcher from this application' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (user.id === researcherUserId && reviewData.reviewee_id !== companyUserId) {
        return new Response(
          JSON.stringify({ error: 'Researcher can only review the company from this application' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем, нет ли уже отзыва от этого пользователя по этой заявке
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('application_id', reviewData.application_id)
        .eq('reviewer_id', user.id)
        .single()

      if (existingReview) {
        return new Response(
          JSON.stringify({ error: 'You have already reviewed this application' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Создаем отзыв
      const { data: review, error } = await supabase
        .from('reviews')
        .insert([{
          application_id: reviewData.application_id,
          reviewer_id: user.id,
          reviewee_id: reviewData.reviewee_id,
          rating: reviewData.rating,
          comment: reviewData.comment
        }])
        .select(`
          *,
          reviewer:reviewer_id (
            id,
            email,
            company_profiles (
              company_name,
              logo_url
            ),
            researcher_profiles (
              first_name,
              last_name,
              avatar_url
            )
          ),
          reviewee:reviewee_id (
            id,
            email,
            company_profiles (
              company_name,
              logo_url
            ),
            researcher_profiles (
              first_name,
              last_name,
              avatar_url
            )
          ),
          applications (
            id,
            projects (
              title
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
        JSON.stringify({ review }), 
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /reviews/:id - обновить отзыв
    if (req.method === 'PUT' && pathSegments.length === 2) {
      const reviewId = pathSegments[1]
      const updateData: UpdateReviewData = await req.json()
      
      // Проверяем, что отзыв существует и принадлежит текущему пользователю
      const { data: existingReview, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .eq('reviewer_id', user.id)
        .single()

      if (fetchError || !existingReview) {
        return new Response(
          JSON.stringify({ error: 'Review not found or access denied' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Валидация рейтинга
      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        return new Response(
          JSON.stringify({ error: 'Rating must be between 1 and 5' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Обновляем отзыв
      const { data: review, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', reviewId)
        .eq('reviewer_id', user.id)
        .select(`
          *,
          reviewer:reviewer_id (
            id,
            email,
            company_profiles (
              company_name,
              logo_url
            ),
            researcher_profiles (
              first_name,
              last_name,
              avatar_url
            )
          ),
          reviewee:reviewee_id (
            id,
            email,
            company_profiles (
              company_name,
              logo_url
            ),
            researcher_profiles (
              first_name,
              last_name,
              avatar_url
            )
          ),
          applications (
            id,
            projects (
              title
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
        JSON.stringify({ review }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /reviews/:id - удалить отзыв
    if (req.method === 'DELETE' && pathSegments.length === 2) {
      const reviewId = pathSegments[1]
      
      // Проверяем права доступа и удаляем
      const { data: deletedReview, error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('reviewer_id', user.id)
        .select('id')
        .single()

      if (error || !deletedReview) {
        return new Response(
          JSON.stringify({ error: 'Review not found or access denied' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Review deleted successfully' }), 
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