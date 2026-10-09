import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ceiijirjiqjhqzhwacio.supabase.co';
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2] || '').trim();

if (!SERVICE_KEY) {
  console.log('Error: SUPABASE_SERVICE_ROLE_KEY is required to delete accounts from Supabase Auth.');
  console.log('You can pass it as: node server/scripts/clear-supabase-users.js <YOUR_SERVICE_ROLE_KEY>');
  console.log('Or add SUPABASE_SERVICE_ROLE_KEY=eyJ... to your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function clearUsers() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('Failed to list Supabase users:', error.message);
      process.exit(1);
    }

    const users = data?.users || [];
    console.log(`Found ${users.length} user(s) in Supabase project ${SUPABASE_URL}`);

    if (users.length === 0) {
      console.log('No user accounts found in Supabase. Project is already empty!');
      process.exit(0);
    }

    for (const u of users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) {
        console.error(`Failed to delete ${u.email}:`, delErr.message);
      } else {
        console.log(`Deleted Supabase account: ${u.email} (${u.id})`);
      }
    }

    console.log('All Supabase accounts have been cleared successfully!');
  } catch (err) {
    console.error('Unexpected error while clearing users:', err);
  }
}

clearUsers();
