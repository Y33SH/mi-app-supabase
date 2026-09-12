import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://qsnkzdbwqapuwcnjhwzq.supabase.co'

const supabaseKey = 'sb_publishable_8ovGZWhXJlV3pm0vsmh9HA_0isIu2RE'

export const supabase = createClient(supabaseUrl, supabaseKey)