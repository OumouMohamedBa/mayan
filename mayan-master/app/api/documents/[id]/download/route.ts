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
    
    const { searchParams } = new URL(request.url);
    const forceDownload = searchParams.get('download') === 'true';
    
    // Download the file (blob contains the correct mime type from Mayan)
    const blob = await downloadMayanDocumentFileServer(documentId)
    
    // Determine filename and content type
    // Priority 1: Use the mime type from the actual downloaded file
    let contentType = blob.type;
    
    // Priority 2: Default to PDF if blob type is generic or missing
    if (!contentType || contentType === 'application/octet-stream') {
        contentType = 'application/pdf';
    }

    let filename = `document-${documentId}.pdf`; // Default extension
    
    if (document.label) {
        filename = document.label;
        // Ensure extension matches content type if possible
        if (contentType === 'application/pdf' && !filename.toLowerCase().endsWith('.pdf')) {
            filename += '.pdf';
        }
    }
    
    if (document.latest_version) {
      filename = document.latest_version.file_filename || filename
      // Only override content type from metadata if we don't have a good one yet
      if (!contentType || contentType === 'application/octet-stream') {
          contentType = document.latest_version.file_mimetype || contentType
      }
    }
    
    const dispositionType = forceDownload ? 'attachment' : 'inline';
    console.log(`DEBUG: Serving download with Content-Type: ${contentType}, Filename: ${filename}, Disposition: ${dispositionType}`);
    
    // Return the blob with appropriate headers for streaming
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${dispositionType}; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
