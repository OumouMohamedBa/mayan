// Mayan EDMS API Server-side Client
// This file is for server-side use only (API routes, server components)

import { MayanDocument, MayanDocumentVersion, MayanPaginatedResponse, MayanError } from './mayanClient'

const BASE_URL = process.env.MAYAN_BASE_URL || 'http://localhost:8000';
const TOKEN = process.env.MAYAN_API_TOKEN;

// Helper pour les headers JSON
const getAuthHeaders = () => ({
  'Authorization': `Token ${TOKEN}`,
  'Content-Type': 'application/json',
});

// --- 1. LISTER LES DOCUMENTS ---
export async function listMayanDocuments(query?: string, page: number = 1, pageSize: number = 20): Promise<MayanPaginatedResponse<MayanDocument>> {
  if (!TOKEN) throw new Error("MAYAN_API_TOKEN is missing");

  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (query && query.trim()) {
    params.append('q', query.trim());
  }

  const url = `${BASE_URL}/api/v4/documents/?${params.toString()}`;

  const res = await fetch(url, {
    headers: getAuthHeaders(),
    cache: 'no-store'
  });

  if (!res.ok) throw new Error(`Failed to list documents: ${res.status}`);
  
  const data = await res.json();
  return data;
}

// Alias for backward compatibility
export const listMayanDocumentsServer = listMayanDocuments;

// --- 2. CRÉER UN DOCUMENT (UPLOAD BLINDÉ) ---
export async function createDocument(formData: FormData): Promise<MayanDocument> {
  const document_type_id = formData.get("document_type_id");
  const label = formData.get("label") as string;
  const description = formData.get("description") as string;
  const file = formData.get("file") as File;

  if (!file || !document_type_id) throw new Error("Missing file or type");

  console.log(`🚀 [Upload] Step 1: Creating Shell for "${label || file.name}"...`);

  // STEP 1: Metadata
  const createRes = await fetch(`${BASE_URL}/api/v4/documents/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      document_type_id: parseInt(document_type_id as string),
      label: label || file.name,
      description: description || "",
      language: "eng",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error("❌ Step 1 Failed:", err);
    throw new Error(`Step 1 Failed: ${err}`);
  }

  const docData = await createRes.json();
  const docId = docData.id;

  // STEP 2: File Content
  try {
    // 1. Convert to Blob (Native)
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileBlob = new Blob([buffer], { type: file.type || 'application/pdf' });

    // 2. Build Native FormData
    const form = new FormData();
    form.append('action_name', 'replace');
    // 3rd arg is filename (Critical for Mayan)
    form.append('file_new', fileBlob, file.name);

    // 3. Send Request
    const uploadRes = await fetch(`${BASE_URL}/api/v4/documents/${docId}/files/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
        // NO Content-Type header here! Next.js handles the boundary automatically.
      },
      body: form,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("❌ Step 2 Failed (Mayan Rejected):", err);
      throw new Error(err);
    }

    console.log("✅ [Upload] Step 2 Success!");
    return docData;

  } catch (error: any) {
    console.warn(`⚠️ Upload failed. Cleaning up empty shell ${docId}...`);
    try {
      await deleteDocument(docId);
    } catch (e) {
      console.error("Failed to cleanup document:", e);
    }
    throw new Error(`Upload Failed: ${error.message}`);
  }
}

// --- 3. SUPPRIMER UN DOCUMENT (ROBUSTE) ---
export async function deleteDocument(id: string | number): Promise<void> {
  const url = `${BASE_URL}/api/v4/documents/${id}/`;
  console.log(`🗑 Deleting document ${id}...`);

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Token ${TOKEN}`,
    },
  });

  if (res.status === 204 || res.status === 202) {
    console.log(`✅ Document ${id} deleted.`);
    return;
  }

  const err = await res.text();
  console.error(`❌ Delete Failed: ${res.status}`, err);
  throw new Error(`Delete failed: ${err}`);
}

// --- 4. TÉLÉCHARGER UN DOCUMENT ---
export async function downloadMayanDocumentFile(id: string | number, versionId?: number): Promise<Blob> {
  let downloadUrl: string;
  
  if (versionId) {
     downloadUrl = `${BASE_URL}/api/v4/documents/${id}/versions/${versionId}/download/`;
  } else {
    // D'abord on récupère les infos pour avoir l'URL de la dernière version
    const docRes = await fetch(`${BASE_URL}/api/v4/documents/${id}/`, {
        headers: getAuthHeaders(),
    });

    if (!docRes.ok) throw new Error("Document not found");
    const doc = await docRes.json();

    // Use download_url if available (user robust code), or construct it from version ID
    downloadUrl = (doc.latest_version as any)?.download_url;
    
    if (!downloadUrl) {
        if (doc.latest_version?.id) {
            downloadUrl = `${BASE_URL}/api/v4/documents/${id}/versions/${doc.latest_version.id}/download/`;
        } else {
            throw new Error("No latest version found (Empty document?)");
        }
    }
  }

  // Ensuite on télécharge le flux
  const fileRes = await fetch(downloadUrl, {
    headers: {
      'Authorization': `Token ${TOKEN}`,
    },
  });

  if (!fileRes.ok) throw new Error(`Failed to download file: ${fileRes.status}`);

  return await fileRes.blob();
}

// Alias for backward compatibility
export const downloadMayanDocumentFileServer = downloadMayanDocumentFile;

// --- ADDITIONAL FUNCTIONS FOR COMPATIBILITY ---

export async function listDocumentTypes(): Promise<MayanPaginatedResponse<any>> {
  const res = await fetch(`${BASE_URL}/api/v4/document_types/`, {
    headers: getAuthHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to list document types: ${res.status}`);
  return await res.json();
}

export async function getMayanDocumentServer(documentId: number): Promise<MayanDocument> {
  const res = await fetch(`${BASE_URL}/api/v4/documents/${documentId}/`, {
    headers: getAuthHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to get document: ${res.status}`);
  return await res.json();
}

export async function getMayanDocumentVersionsServer(documentId: number): Promise<MayanPaginatedResponse<MayanDocumentVersion>> {
  const res = await fetch(`${BASE_URL}/api/v4/documents/${documentId}/versions/`, {
    headers: getAuthHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to get document versions: ${res.status}`);
  return await res.json();
}
