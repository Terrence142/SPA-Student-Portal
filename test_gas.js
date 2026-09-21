const url = 'https://script.google.com/macros/s/AKfycbz6cR-xROnKZME0Fu3CSxiyhYlt4gJgcxxx-Wu_DR9sT2d8H4mrPTtU4XM5GWXFjzfe/exec';

async function test() {
  console.log("Testing fetch_data...");
  try {
    const fetchRes = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        action: 'fetch_data',
        role: 'admin'
      })
    });
    const fetchText = await fetchRes.text();
    console.log("fetch_data Response:", fetchText);

    console.log("\nTesting fetch_announcements...");
    const annRes = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        action: 'fetch_announcements'
      })
    });
    const annText = await annRes.text();
    console.log("fetch_announcements Response:", annText);

  } catch (e) {
    console.error("Error:", e);
  }
}

test();
