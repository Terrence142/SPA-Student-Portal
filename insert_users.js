const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ptznrtwituumppuxsrno.supabase.co';
const supabaseKey = 'sb_publishable_K472z0xikGFAY4sgVRZyIw_6a_BKI79';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertUsers() {
  const usersToInsert = [
    {
      student_id: 'ADMIN-001',
      password: 'adminpass',
      role: 'admin',
      name: 'System Administrator'
    },
    {
      student_id: 'STAFF-001',
      password: 'staffpass',
      role: 'staff',
      name: 'School Staff'
    },
    {
      student_id: '2025-151',
      password: 'domingodannamielleb2025151',
      role: 'student',
      name: 'Domingo, Dannamielle B.',
      dob: 'March 18, 2009',
      age: 17,
      sex: 'F',
      contact: '9172778441',
      balance: 30000,
      status_val: 'Unpaid'
    },
    {
      student_id: '2021-021',
      password: 'centonesmarfisharey2021021',
      role: 'student',
      name: 'Centones, Marfisharey',
      dob: 'October 18, 2008',
      age: 17,
      sex: 'F',
      contact: '9851157567',
      balance: 0,
      status_val: 'Unpaid'
    },
    {
      student_id: '2021-024',
      password: 'estrellasarahaletheia2021024',
      role: 'student',
      name: 'Estrella, Sarah Aletheia',
      dob: 'November 27, 2009',
      age: 16,
      sex: 'F',
      contact: '9758206133'
    },
    {
      student_id: '2025-155',
      password: 'rochcleilaniejeann2025155',
      role: 'student',
      name: 'Roch, Cleilanie Jeann',
      dob: 'September 17, 2009',
      age: 16,
      sex: 'F',
      contact: '9817267320',
      balance: 0,
      status_val: 'Unpaid'
    }
  ];

  for (const user of usersToInsert) {
    const { data, error } = await supabase.from('users').upsert(user, { onConflict: 'student_id' });
    console.log(`Inserted ${user.student_id}:`, error ? error.message : 'Success');
  }
}

insertUsers();
