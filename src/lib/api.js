// Picks the live Supabase backend when keys are configured, otherwise the
// in-browser demo backend. Every screen talks only to `api`.
import { supaApi, supabaseConfigured } from './supaApi'
import { mockApi } from './mockApi'

export const api = supabaseConfigured ? supaApi : mockApi
export const isDemo = !supabaseConfigured
