/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://oelornnixkoqpugdyktx.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbG9ybm5peGtvcXB1Z2R5a3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTA5ODcsImV4cCI6MjA5NzgyNjk4N30.RU2cQ1GFq6Am08nDJJts2OSSdi4TQA9a3CCH49t0ig0';

export const isSupabaseConfigured = 
  Boolean(supabaseUrl) && 
  supabaseUrl !== 'MY_SUPABASE_URL' && 
  Boolean(supabaseAnonKey) && 
  supabaseAnonKey !== 'MY_SUPABASE_ANON_KEY';

// Initialize lazy client or null if not configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
