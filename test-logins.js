// Test login for all users from the spreadsheet
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6cR-xROnKZME0Fu3CSxiyhYlt4gJgcxxx-Wu_DR9sT2d8H4mrPTtU4XM5GWXFjzfe/exec';

const users = [
  { id: 'ADMIN-001', password: 'adminpass', expectedRole: 'admin' },
  { id: 'STAFF-001', password: 'staffpass', expectedRole: 'staff' },
  { id: '2025-151', password: 'domingodannamielle2025151', expectedRole: 'student' },
  { id: '2021-021', password: 'centonesmartisharey2021021', expectedRole: 'student' },
  { id: '2021-024', password: 'estrellasarahaletheia2021024', expectedRole: 'student' },
  { id: '2025-155', password: 'rochelelaniejenn2025155', expectedRole: 'student' },
];

async function testLogin(user) {
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'login', student_id: user.id, password: user.password }),
      redirect: 'follow',
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      const roleMatch = data.user.role?.toLowerCase() === user.expectedRole;
      console.log(`✅ ${user.id} (${user.expectedRole}) → LOGIN OK | Name: ${data.user.name || 'N/A'} | Role: ${data.user.role} | Balance: ₱${data.user.balance || 0} | Status: ${data.user.status_val || 'N/A'} ${roleMatch ? '' : '⚠️ ROLE MISMATCH!'}`);
    } else {
      console.log(`❌ ${user.id} (${user.expectedRole}) → FAILED: ${data.message}`);
    }
  } catch (err) {
    console.log(`❌ ${user.id} → ERROR: ${err.message}`);
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SPA Student Portal — Login Test Suite');
  console.log('  Testing against: spa-student-portal.vercel.app');
  console.log('═══════════════════════════════════════════════════\n');
  
  // First call warms up Google Apps Script (cold start)
  console.log('⏳ Warming up Google Apps Script (cold start)...');
  try {
    await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'verifyId', student_id: 'ADMIN-001' }), redirect: 'follow' });
    console.log('✓ Server warm.\n');
  } catch (e) {
    console.log('⚠️ Warmup failed, continuing anyway...\n');
  }

  console.log('── Testing All User Logins ──\n');
  
  for (const user of users) {
    await testLogin(user);
  }
  
  console.log('\n── Testing Invalid Credentials ──\n');
  await testLogin({ id: 'FAKE-999', password: 'wrongpassword', expectedRole: 'should-fail' });
  await testLogin({ id: 'ADMIN-001', password: 'wrongpassword', expectedRole: 'should-fail' });
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Test Suite Complete');
  console.log('═══════════════════════════════════════════════════');
}

runAllTests();
