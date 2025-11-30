import { NextRequest, NextResponse } from 'next/server'
import { downloadMayanDocumentFileServer, getMayanDocumentServer } from '@/lib/mayanServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documentId = parseInt(id)
    
    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: 'Invalid document ID' },
        { status: 400 }
      )
    }

    // Get document metadata for filename
    const document = await getMayanDocumentServer(documentId)
    
    // Download the latest version
    const blob = await downloadMayanDocumentFileServer(documentId)
    
    // Determine filename and content type
    let filename = `document-${documentId}`
    let contentType = 'application/octet-stream'
    
    if (document.latest_version) {
      filename = document.latest_version.file_filename || filename
      contentType = document.latest_version.file_mimetype || contentType
    }
    
    // Return the blob with appropriate headers for streaming
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error downloading document:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to download document'
    
    // Return JSON error for debugging, but in production you might want to return a proper error page
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
