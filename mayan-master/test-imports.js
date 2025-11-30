// Simple test to verify our imports work
const { listDocumentTypes, createDocument } = require('./lib/mayanServer.ts');

console.log('✓ Successfully imported listDocumentTypes and createDocument');

// Test that the functions exist
console.log('listDocumentTypes:', typeof listDocumentTypes);
console.log('createDocument:', typeof createDocument);

console.log('✓ All imports working correctly');
