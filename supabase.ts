import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rzznmmlosvfbjftrroyo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6em5tbWxvc3ZmYmpmdHJyb3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzEzNDcsImV4cCI6MjA2NTc0NzM0N30.CTesa9Xasiiuyb2v4Hy932cJLlzbToFYQkxI6_O4yJs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
