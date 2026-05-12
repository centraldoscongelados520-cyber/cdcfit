import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Category =
  | 'doces'
  | 'frutas'
  | 'graos'
  | 'hortifruti'
  | 'industrializados'
  | 'laticinios'
  | 'proteinas'
  | 'temperos'

export interface Item {
  id: string
  name: string
  category: Category
  checked: boolean
  created_at: string
}
