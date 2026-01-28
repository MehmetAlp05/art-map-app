import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://htgexbvqztvjrqmdiera.supabase.co'
const supabaseAnonKey = 'sb_publishable_TJFRX8NBqJjB7Xvae68tBA_-yxcHfLl'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)