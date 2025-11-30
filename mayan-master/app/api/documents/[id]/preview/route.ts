import { NextRequest, NextResponse } from 'next/server'
import { getMayanDocumentServer } from '@/lib/mayanServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documentId = parseInt(id)
    
    if (isNaN(documentId)) {
      return new NextResponse('Invalid document ID', { status: 400 })
    }

    // 1. Get document info to find latest version
    // We need the Token to call Mayan
    const token = process.env.MAYAN_API_TOKEN
    const baseUrl = process.env.MAYAN_BASE_URL || 'http://127.0.0.1:8000'
    
    if (!token) {
      return new NextResponse('Server configuration error', { status: 500 })
    }

    // Fetch versions list (this endpoint returns pages_first with image_url)
    console.log(`DEBUG: Fetching versions for doc ${documentId}`)
    const versionsRes = await fetch(`${baseUrl}/api/v4/documents/${documentId}/versions/`, {
        headers: { 'Authorization': `Token ${token}` }
    });

    if (!versionsRes.ok) {
        console.error(`DEBUG: Versions fetch failed: ${versionsRes.status}`)
        return new NextResponse('Document not found', { status: 404 });
    }
    
    const versionsData = await versionsRes.json();
    console.log('DEBUG: Versions response:', JSON.stringify(versionsData, null, 2))
    
    // Get the first version (usually the active one)
    const firstVersion = versionsData.results?.[0];
    
    if (!firstVersion) {
        return new NextResponse('No versions available', { status: 404 });
    }

    // Get the image URL directly from pages_first
    const imageUrl = firstVersion.pages_first?.image_url;
    console.log(`DEBUG: Image URL from pages_first: ${imageUrl}`)

    if (!imageUrl) {
        return new NextResponse('No preview image available', { status: 404 });
    }

    // Fetch the actual image content
    console.log(`DEBUG: Fetching image from ${imageUrl}`)
    const imageRes = await fetch(imageUrl, {
        headers: { 'Authorization': `Token ${token}` }
    });

    if (!imageRes.ok) {
        console.error(`DEBUG: Image fetch failed: ${imageRes.status}`)
        return new NextResponse('Failed to fetch image', { status: 502 });
    }

    const imageBuffer = await imageRes.arrayBuffer();
    console.log(`DEBUG: Image fetched successfully (${imageBuffer.byteLength} bytes)`)

    // 4. Return the image
    return new NextResponse(Buffer.from(imageBuffer), {
        headers: {
            'Content-Type': 'image/jpeg', // Mayan usually returns JPEG
            'Cache-Control': 'public, max-age=3600'
        }
    });

  } catch (error) {
    console.error('Error fetching preview:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
