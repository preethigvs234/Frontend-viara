import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://ctiyctfzomtdmevnpemz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0aXljdGZ6b210ZG1ldm5wZW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjE2OTYsImV4cCI6MjA3NTMzNzY5Nn0.l5rAZAxywrDlH64QJUE6vdWcHgLRkFVelOAIx4bdIPA';
export const supabase = createClient(supabaseUrl, supabaseKey);