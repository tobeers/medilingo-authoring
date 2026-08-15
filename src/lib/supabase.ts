import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://bisopiknykosyddcvres.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_lFcqbehPvvfaVNo5fcW96Q_yAsOCtwK';

export const supabase = createClient(url, key);
