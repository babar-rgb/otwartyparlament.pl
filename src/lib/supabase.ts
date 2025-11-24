import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xmlsuhshmmrfwhdammcv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbHN1aHNobW1yZndoZGFtbWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTg4MzIsImV4cCI6MjA3OTQ3NDgzMn0.0FYzencUg_1Oq8Pygk5ewCNzS5he1-vOBj5bVdEa4Eo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
