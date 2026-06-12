import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Category =
  | 'doces'
  | 'hortifruti'
  | 'laticinios'
  | 'proteinas'
  | 'temperos'
  | 'seco'
  | 'limpeza'

export interface Item {
  id: string
  name: string
  category: Category
  checked: boolean
  stock_quantity: number
  created_at: string
}

export interface Withdrawal {
  id: string
  item_id: string
  item_name: string
  category: string
  quantity: number
  person: 'Thais' | 'Tawana'
  created_at: string
}
