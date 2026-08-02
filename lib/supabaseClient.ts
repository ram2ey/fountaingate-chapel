import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lwadcustbpyyxoecbmgj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YWRjdXN0YnB5eXhvZWNibWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MTc0MTMsImV4cCI6MjEwMTE5MzQxM30.uyrtTayca_S4hSs-GBjHrPBhMTldVz0FVGn63B2eY1E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
