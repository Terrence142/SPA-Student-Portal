const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ptznrtwituumppuxsrno.supabase.co';
const supabaseKey = 'sb_publishable_K472z0xikGFAY4sgVRZyIw_6a_BKI79';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('users').select('*');
  console.log("All users data:", data);
  console.log("All users error:", error);
  
  const { data: adminData, error: adminError } = await supabase.from('users').select('*').eq('student_id', 'ADMIN-001').single();
  console.log("Admin data:", adminData);
  console.log("Admin error:", adminError);
}

test();
