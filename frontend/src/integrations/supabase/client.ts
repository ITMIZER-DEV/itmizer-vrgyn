// Supabase is deprecated in favor of NestJS API
// import { createClient } from '@supabase/supabase-js';
// 
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// 
// export const supabase = createClient(supabaseUrl, supabaseKey);

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    signInWithPassword: async () => ({ error: { message: 'Supabase removed' } }),
    signUp: async () => ({ error: { message: 'Supabase removed' } }),
    signOut: async () => { },
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: null, error: null })
      })
    })
  })
} as any;