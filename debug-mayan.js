// const fetch = require('node-fetch'); // Native fetch in Node 18+

const BASE_URL = 'http://127.0.0.1:8000';
const TOKEN = 'a436ff34059729e47ce9d600073318358debed24';
const DOC_ID = 3;

async function checkEndpoint(name, url) {
  try {
    console.log(`\n--- Checking ${name} ---`);
    console.log(`URL: ${url}`);
    const res = await fetch(url, {
      headers: { 'Authorization': `Token ${TOKEN}` }
    });
    console.log(`Status: ${res.status}`);
    
    if (res.ok) {
        const contentType = res.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            // Log relevant parts
            if (data.results) {
                console.log(`Results count: ${data.count}`);
                if (data.results.length > 0) {
                    console.log('First item keys:', Object.keys(data.results[0]));
                    console.log('First item sample:', JSON.stringify(data.results[0], null, 2).substring(0, 500) + '...');
                }
            } else {
                console.log('Data keys:', Object.keys(data));
                // Check for download_url in document
                if (data.download_url) console.log(`FOUND download_url: ${data.download_url}`);
                if (data.latest_version) console.log(`latest_version:`, data.latest_version);
            }
        } else {
            console.log('Response is not JSON (likely a file or error page)');
        }
    } else {
        console.log('Error response');
    }
  } catch (e) {
    console.error(`Failed: ${e.message}`);
  }
}

async function run() {
    await checkEndpoint('Document Details', `${BASE_URL}/api/v4/documents/${DOC_ID}/`);
    await checkEndpoint('Document Versions', `${BASE_URL}/api/v4/documents/${DOC_ID}/versions/`);
    await checkEndpoint('Document Files', `${BASE_URL}/api/v4/documents/${DOC_ID}/files/`);
    
    // ID du fichier trouvé dans le log précédent : 3
    const FILE_ID = 3; 
    await checkEndpoint('Document File Download', `${BASE_URL}/api/v4/documents/${DOC_ID}/files/${FILE_ID}/download/`);
}

run();
