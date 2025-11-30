// Mayan EDMS API Server-side Client
// This file is for server-side use only (API routes, server components)

import { MayanDocument, MayanDocumentVersion, MayanPaginatedResponse, MayanError } from './mayanClient'

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

export async function downloadMayanDocumentFileServer(
  documentId: number,
  versionId?: number
): Promise<Blob> {
  const endpoint = versionId 
    ? `/documents/${documentId}/versions/${versionId}/download/`
    : `/documents/${documentId}/download/`;

  const baseUrl = process.env.MAYAN_BASE_URL || 'http://localhost:8000';
  const apiToken = process.env.MAYAN_API_TOKEN;

  if (!apiToken) {
    throw new Error('MAYAN_API_TOKEN environment variable is not set');
  }

  const url = `${baseUrl}/api/v4${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to download document file');
  }
}
