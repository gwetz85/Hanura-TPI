import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ljrectvmixcbhgjoazjb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcmVjdHZtaXhjYmhnam9hempiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NDQxNDcsImV4cCI6MjA5NTIyMDE0N30.a1s9nd7wUV7X_Y2_-oFt4xKWUt37qWTpjCIrsy4FNww';

export const supabase = createClient(supabaseUrl, supabaseKey);
