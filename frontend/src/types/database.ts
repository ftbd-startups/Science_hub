// Типы для схемы базы данных Science Hub MVP

export type UserRole = 'company' | 'researcher'
export type ProjectStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'
export type ChatStatus = 'active' | 'closed' | 'archived'
export type MessageType = 'text' | 'file'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface CompanyProfile {
  id: string
  user_id: string
  company_name: string
  description?: string
  website?: string
  industry?: string
  company_size?: string
  location?: string
  logo_url?: string
  verified: boolean
  created_at: string
  updated_at: string
}

export interface ResearcherProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  bio?: string
  specialization?: string[]
  education?: string
  experience_years?: number
  location?: string
  avatar_url?: string
  portfolio_url?: string
  verified: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  company_id: string
  title: string
  description: string
  requirements: string
  skills_required: string[]
  budget_min?: number
  budget_max?: number
  deadline?: string
  status: ProjectStatus
  created_at: string
  updated_at: string
  // Дополнительные поля из join
  companies?: {
    name: string
    logo_url?: string
    industry?: string
  }
}

export interface Application {
  id: string
  project_id: string
  researcher_id: string
  cover_letter: string
  proposed_timeline?: string
  proposed_budget?: number
  status: ApplicationStatus
  created_at: string
  updated_at: string
  // Дополнительные поля из join
  projects?: {
    id: string
    title: string
    description: string
    requirements?: string
    budget_min?: number
    budget_max?: number
    deadline?: string
    company_id?: string
    companies?: {
      name: string
      logo_url?: string
      industry?: string
    }
  }
  researchers?: {
    first_name: string
    last_name: string
    avatar_url?: string
    bio?: string
    specialization?: string[]
    education?: string
    experience_years?: number
  }
}

export interface Chat {
  id: string
  application_id: string
  company_id: string
  researcher_id: string
  status: ChatStatus
  created_at: string
  updated_at: string
  // Дополнительные поля из join
  applications?: {
    id: string
    status: ApplicationStatus
    project_id?: string
    researcher_id?: string
    projects?: {
      id: string
      title: string
      company_id?: string
      companies?: {
        name: string
        logo_url?: string
      }
    }
    researchers?: {
      first_name: string
      last_name: string
      avatar_url?: string
    }
  }
  messages?: Message[]
  last_message?: Message | null
  unread_count?: number
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: MessageType
  file_url?: string
  created_at: string
  updated_at: string
  // Дополнительные поля из join
  sender?: {
    id: string
    user_type: 'company' | 'researcher'
    companies?: {
      name: string
      logo_url?: string
    }
    researchers?: {
      first_name: string
      last_name: string
      avatar_url?: string
    }
  }
}

export interface Review {
  id: string
  application_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  created_at: string
  updated_at: string
}

// Типы для Database из Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<User, 'id'>>
      }
      company_profiles: {
        Row: CompanyProfile
        Insert: Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<CompanyProfile, 'id'>>
      }
      researcher_profiles: {
        Row: ResearcherProfile
        Insert: Omit<ResearcherProfile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ResearcherProfile, 'id'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Project, 'id'>>
      }
      applications: {
        Row: Application
        Insert: Omit<Application, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Application, 'id'>>
      }
      chats: {
        Row: Chat
        Insert: Omit<Chat, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Chat, 'id'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Message, 'id'>>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Review, 'id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      project_status: ProjectStatus
      application_status: ApplicationStatus
      chat_status: ChatStatus
      message_type: MessageType
    }
  }
} 