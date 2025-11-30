// Mayan EDMS API Server-side Client
// This file is for server-side use only (API routes, server components)

import { MayanDocument, MayanDocumentVersion, MayanPaginatedResponse, MayanError } from './mayanClient'
import NodeFormData from 'form-data'

// Server-side Mayan API fetch wrapper with token authentication and error handling
export async function mayanFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.MAYAN_BASE_URL || 'http://localhost:8000';
  const apiToken = process.env.MAYAN_API_TOKEN;

  console.log('Server-side mayanFetch - Token:', apiToken ? 'exists' : 'missing');
  console.log('Server-side mayanFetch - Base URL:', baseUrl);

  if (!apiToken) {
    throw new Error('MAYAN_API_TOKEN environment variable is not set');
  }

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${baseUrl}/api/v4${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${apiToken}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData: MayanError = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.error || 'Unknown error';
      throw new Error(`Mayan API error (${response.status}): ${errorMessage}`);
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch from Mayan API');
  }
}

// Server-side functions for API routes
export async function getMayanDocumentServer(
  documentId: number
): Promise<MayanDocument> {
  return mayanFetch<MayanDocument>(`/documents/${documentId}/`);
}

export async function getMayanDocumentVersionsServer(
  documentId: number
): Promise<MayanPaginatedResponse<MayanDocumentVersion>> {
  return mayanFetch<MayanPaginatedResponse<MayanDocumentVersion>>(
    `/documents/${documentId}/versions/`
  );
}

export async function listMayanDocumentsServer(
  query?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<MayanPaginatedResponse<MayanDocument>> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (query && query.trim()) {
    params.append('q', query.trim());
  }

  const endpoint = `/documents/?${params.toString()}`;
  
  return mayanFetch<MayanPaginatedResponse<MayanDocument>>(endpoint);
}

export async function listDocumentTypes(): Promise<MayanPaginatedResponse<any>> {
  return mayanFetch<MayanPaginatedResponse<any>>('/document_types/');
}

export async function createDocument(formData: FormData): Promise<MayanDocument> {
  const baseUrl = process.env.MAYAN_BASE_URL || 'http://localhost:8000';
  const apiToken = process.env.MAYAN_API_TOKEN;

  if (!apiToken) {
    throw new Error('MAYAN_API_TOKEN environment variable is not set');
  }

  // Extract data from the incoming FormData
  const document_type_id = formData.get('document_type_id');
  const label = formData.get('label') as string;
  const description = formData.get('description') as string;
  const file = formData.get('file') as File;

  if (!document_type_id || !file) {
    throw new Error('Missing required fields: document_type_id or file');
  }

  console.log(`createDocument - Starting 2-step upload for "${label || file.name}"`);

  try {
    // STEP 1: Create the Shell (Metadata)
    const createUrl = `${baseUrl}/api/v4/documents/`;
    console.log('createDocument - Step 1: Creating document shell at', createUrl);
    
    const metadataBody = {
      document_type_id: parseInt(document_type_id as string),
      label: label || file.name,
      description: description || 'Uploaded via Next.js Admin',
      language: 'fr', // Default to French
    };

    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadataBody),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json().catch(() => ({}));
      console.error('createDocument - Step 1 Failed:', errorData);
      throw new Error(`Failed to create document shell: ${errorData.detail || createRes.statusText}`);
    }

    const docData = await createRes.json() as MayanDocument;
    const docId = docData.id;
    console.log(`createDocument - Step 1 Success. Document ID: ${docId}`);

    // STEP 2: Upload the File (Content)
    const uploadUrl = `${baseUrl}/api/v4/documents/${docId}/files/`;
    console.log('createDocument - Step 2: Uploading file content to', uploadUrl);
    console.log(`🚀 [Step 2] Uploading file with 'form-data' lib...`);
    
    // 1. Prepare Form using the library
    const form = new NodeFormData();
    // FIX 1: Add the required action_name
    form.append('action_name', 'replace');

    // FIX 2: Use the correct field name 'file_new'
    const buffer = Buffer.from(await file.arrayBuffer());
    form.append('file_new', buffer, {
      filename: file.name,
      contentType: file.type || 'application/pdf',
    });

    // 2. Send Request
    // Note: form.getHeaders() creates the correct Content-Type with boundary
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        ...form.getHeaders(),
      },
      body: form as any, // Cast to any to satisfy fetch types if needed
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error(`createDocument - Step 2 Failed (${uploadRes.status}):`, errorText);
      
      // Cleanup: Delete the empty shell
      try {
        console.log(`createDocument - Attempting to clean up empty document ${docId}...`);
        await fetch(`${baseUrl}/api/v4/documents/${docId}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${apiToken}` }
        });
        console.log('createDocument - Cleanup successful');
      } catch (cleanupError) {
        console.error('createDocument - Cleanup failed:', cleanupError);
      }
      
      throw new Error(`Mayan rejected the file (Step 2): ${errorText}`);
    }

    console.log('createDocument - Step 2 Success. Upload complete.');
    
    // Return the initial document data (or fetch fresh data if needed)
    return docData;
  } catch (error) {
    console.error('createDocument - Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload document to Mayan API');
  }
}

export async function downloadMayanDocumentFileServer(
  documentId: number,
  versionId?: number
): Promise<Blob> {
  const baseUrl = process.env.MAYAN_BASE_URL || 'http://localhost:8000';
  const apiToken = process.env.MAYAN_API_TOKEN;

  if (!apiToken) {
    throw new Error('MAYAN_API_TOKEN environment variable is not set');
  }

  try {
    let downloadUrl: string;

    if (versionId) {
      // Download specific version
      const endpoint = `/documents/${documentId}/versions/${versionId}/download/`;
      downloadUrl = `${baseUrl}/api/v4${endpoint}`;
    } else {
      // Download latest version - first get document metadata to find latest version
      const document = await getMayanDocumentServer(documentId);
      
      if (!document.latest_version) {
        throw new Error('No latest version found for document');
      }

      // Use the latest_version URL if available, otherwise construct it
      // Note: MayanDocumentVersion doesn't have a url property, so we construct the URL
      const endpoint = `/documents/${documentId}/versions/${document.latest_version.id}/download/`;
      downloadUrl = `${baseUrl}/api/v4${endpoint}`;
    }

    console.log('downloadMayanDocumentFileServer - URL:', downloadUrl);

    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Token ${apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('downloadMayanDocumentFileServer - Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to download document file');
  }
}

export async function deleteDocument(id: string | number): Promise<void> {
  const baseUrl = process.env.MAYAN_BASE_URL || 'http://localhost:8000';
  const apiToken = process.env.MAYAN_API_TOKEN;

  if (!apiToken) {
    throw new Error('MAYAN_API_TOKEN environment variable is not set');
  }

  const url = `${baseUrl}/api/v4/documents/${id}/`;
  console.log('deleteDocument - Deleting document:', url);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Token ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to delete document: ${response.status} ${errorData.detail || response.statusText}`);
  }
  
  console.log('deleteDocument - Document deleted successfully');
}
