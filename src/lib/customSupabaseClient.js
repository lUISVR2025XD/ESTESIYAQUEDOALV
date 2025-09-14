import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwpamvawonbolqgpqkwx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cGFtdmF3b25ib2xxZ3Bxa3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNDc0ODIsImV4cCI6MjA3MjYyMzQ4Mn0.ThkENT5D91u9xIHE2ql3uCRJffnXGkPJwlQkmdUaAkY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);