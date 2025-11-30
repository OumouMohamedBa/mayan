// Mayan EDMS API Client
// Based on Mayan EDMS API v4 documentation

export interface MayanDocument {
  id: number;
  label: string;
  description: string;
  datetime_created: string;
  document_type_id: number;
  document_type_label: string;
  language?: string;
  uuid: string;
  versions_count: number;
  latest_version?: MayanDocumentVersion;
  document_file_url?: string;
  document_type_url?: string;
  url?: string;
  api_version?: string;
}

export interface MayanDocumentVersion {
  id: number;
  document_id: number;
  timestamp: string;
  active: boolean;
  comment: string;
  file_mimetype: string;
  file_filename: string;
  file_size: number;
  encoding: string;
  checksum: string;
  page_count: number;
  uuid: string;
}

export interface MayanPaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface MayanError {
  detail?: string;
  error?: string;
  non_field_errors?: string[];
}

// Mayan API fetch wrapper with token authentication and error handling
export async function mayanFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.MAYAN_BASE_URL || 'http://localhost:8000';
  const apiToken = process.env.MAYAN_API_TOKEN;

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

// List documents from Mayan EDMS with optional search query
export async function listMayanDocuments(
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

// Get a single document by ID
export async function getMayanDocument(
  documentId: number
): Promise<MayanDocument> {
  return mayanFetch<MayanDocument>(`/documents/${documentId}/`);
}

// Get document versions
export async function getMayanDocumentVersions(
  documentId: number
): Promise<MayanPaginatedResponse<MayanDocumentVersion>> {
  return mayanFetch<MayanPaginatedResponse<MayanDocumentVersion>>(
    `/documents/${documentId}/versions/`
  );
}

// Download document file
export async function downloadMayanDocumentFile(
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
