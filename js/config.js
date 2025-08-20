// Supabase configuration
const SUPABASE_URL = 'https://kzwzexjlgukunnsixhdg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6d3pleGpsZ3VrdW5uc2l4aGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYwNTksImV4cCI6MjA3MTEyMjA1OX0.AwqYcWCgI4YbrmOHwx8F1Ar_pePLTvB70hGGipHsp-I';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
