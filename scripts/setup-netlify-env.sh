# Netlify Environment Setup Script
# Run this after installing Netlify CLI: npm install -g netlify-cli

# Login to Netlify
netlify login

# Link your local project to Netlify site
netlify link

# Set environment variables from your .env file
netlify env:set VITE_SUPABASE_URL "https://awokklruxeofxsqxcsnt.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b2trbHJ1eGVvZnhzcXhjc250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTgyNTQsImV4cCI6MjA3Mjk3NDI1NH0.h4fqb_G2ssrqHjVSUTHMHVe4f009Nu706j57lK1NaS0"
netlify env:set VITE_APP_NAME "PartyHaus"
netlify env:set VITE_APP_ENV "production"

# Server-side only (for Netlify Functions, if you plan to use them)
netlify env:set RESEND_API_KEY "re_TKFU8RKA_AHBpgbcaZqtW8HhsYnAMQsdZ"

# Verify the variables are set
netlify env:list

echo "✅ Environment variables configured for Netlify!"
echo "🚀 Your app is ready for deployment!"