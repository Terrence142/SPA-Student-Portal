const url = 'https://script.google.com/macros/s/AKfycbz6cR-xROnKZME0Fu3CSxiyhYlt4gJgcxxx-Wu_DR9sT2d8H4mrPTtU4XM5GWXFjzfe/exec';

async function test() {
  console.log("Testing POST login...");
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        student_id: 'ADMIN-001',
        password: 'password123'
      })
    });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
