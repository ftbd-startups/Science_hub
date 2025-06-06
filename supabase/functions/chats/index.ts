import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CreateChatData {
  application_id: string
}

interface SendMessageData {
  chat_id: string
  content: string
  message_type?: 'text' | 'file'
  file_url?: string
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
    
    // GET /chats - получить все чаты пользователя
    if (req.method === 'GET' && pathSegments.length === 1) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id, researcher_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let query = supabase
        .from('chats')
        .select(`
          *,
          applications (
            id,
            status,
            projects (
              id,
              title,
              companies (
                name,
                logo_url
              )
            ),
            researchers (
              first_name,
              last_name,
              avatar_url
            )
          ),
          messages (
            id,
            content,
            sender_id,
            created_at,
            message_type,
            file_url
          )
        `)

      // Фильтруем чаты в зависимости от роли пользователя
      if (profile.user_type === 'company' && profile.company_id) {
        query = query.eq('company_id', profile.company_id)
      } else if (profile.user_type === 'researcher' && profile.researcher_id) {
        query = query.eq('researcher_id', profile.researcher_id)
      } else {
        return new Response(
          JSON.stringify({ chats: [] }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: chats, error } = await query.order('updated_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Добавляем информацию о последнем сообщении для каждого чата
      const chatsWithLastMessage = chats?.map(chat => ({
        ...chat,
        last_message: chat.messages && chat.messages.length > 0 
          ? chat.messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null,
        unread_count: 0 // TODO: Реализовать подсчет непрочитанных сообщений
      })) || []

      return new Response(
        JSON.stringify({ chats: chatsWithLastMessage }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /chats/:id - получить конкретный чат с сообщениями
    if (req.method === 'GET' && pathSegments.length === 2) {
      const chatId = pathSegments[1]
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id, researcher_id')
        .eq('id', user.id)
        .single()

      // Получаем чат с проверкой доступа
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select(`
          *,
          applications (
            id,
            status,
            project_id,
            researcher_id,
            projects (
              id,
              title,
              company_id,
              companies (
                name,
                logo_url
              )
            ),
            researchers (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('id', chatId)
        .single()

      if (chatError || !chat) {
        return new Response(
          JSON.stringify({ error: 'Chat not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем права доступа
      const hasAccess = (
        (profile?.user_type === 'company' && profile.company_id === chat.company_id) ||
        (profile?.user_type === 'researcher' && profile.researcher_id === chat.researcher_id)
      )

      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Получаем сообщения чата
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles (
            id,
            user_type,
            companies (
              name,
              logo_url
            ),
            researchers (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        return new Response(
          JSON.stringify({ error: messagesError.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          chat: {
            ...chat,
            messages: messages || []
          }
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /chats - создать новый чат (автоматически при принятии заявки)
    if (req.method === 'POST' && pathSegments.length === 1) {
      const chatData: CreateChatData = await req.json()
      
      // Получаем информацию о заявке
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          projects (
            company_id
          )
        `)
        .eq('id', chatData.application_id)
        .single()

      if (appError || !application) {
        return new Response(
          JSON.stringify({ error: 'Application not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (application.status !== 'accepted') {
        return new Response(
          JSON.stringify({ error: 'Can only create chat for accepted applications' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем, нет ли уже чата для этой заявки
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('application_id', chatData.application_id)
        .single()

      if (existingChat) {
        return new Response(
          JSON.stringify({ error: 'Chat already exists for this application' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Создаем новый чат
      const { data: chat, error } = await supabase
        .from('chats')
        .insert([{
          application_id: chatData.application_id,
          company_id: application.projects?.company_id,
          researcher_id: application.researcher_id,
          status: 'active'
        }])
        .select(`
          *,
          applications (
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
        JSON.stringify({ chat }), 
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /chats/:id/messages - отправить сообщение в чат
    if (req.method === 'POST' && pathSegments.length === 3 && pathSegments[2] === 'messages') {
      const chatId = pathSegments[1]
      const messageData: SendMessageData = await req.json()
      
      // Проверяем доступ к чату
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id, researcher_id')
        .eq('id', user.id)
        .single()

      const { data: chat } = await supabase
        .from('chats')
        .select('company_id, researcher_id, status')
        .eq('id', chatId)
        .single()

      if (!chat) {
        return new Response(
          JSON.stringify({ error: 'Chat not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const hasAccess = (
        (profile?.user_type === 'company' && profile.company_id === chat.company_id) ||
        (profile?.user_type === 'researcher' && profile.researcher_id === chat.researcher_id)
      )

      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (chat.status !== 'active') {
        return new Response(
          JSON.stringify({ error: 'Chat is not active' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Создаем сообщение
      const { data: message, error } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          sender_id: user.id,
          content: messageData.content,
          message_type: messageData.message_type || 'text',
          file_url: messageData.file_url
        }])
        .select(`
          *,
          sender:profiles (
            id,
            user_type,
            companies (
              name,
              logo_url
            ),
            researchers (
              first_name,
              last_name,
              avatar_url
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

      // Обновляем время последнего обновления чата
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId)

      return new Response(
        JSON.stringify({ message }), 
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /chats/:id - обновить статус чата
    if (req.method === 'PUT' && pathSegments.length === 2) {
      const chatId = pathSegments[1]
      const updateData = await req.json()
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, company_id, researcher_id')
        .eq('id', user.id)
        .single()

      const { data: chat } = await supabase
        .from('chats')
        .select('company_id, researcher_id')
        .eq('id', chatId)
        .single()

      if (!chat) {
        return new Response(
          JSON.stringify({ error: 'Chat not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const hasAccess = (
        (profile?.user_type === 'company' && profile.company_id === chat.company_id) ||
        (profile?.user_type === 'researcher' && profile.researcher_id === chat.researcher_id)
      )

      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: updatedChat, error } = await supabase
        .from('chats')
        .update(updateData)
        .eq('id', chatId)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ chat: updatedChat }), 
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