import { NextRequest, NextResponse } from 'next/server'
import { downloadMayanDocumentFileServer, getMayanDocumentServer } from '@/lib/mayanServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params
    const documentId = parseInt(id)
    const versionIdNum = parseInt(versionId)
    
    if (isNaN(documentId) || isNaN(versionIdNum)) {
      return NextResponse.json(
        { error: 'Invalid document ID or version ID' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url);
    const forceDownload = searchParams.get('download') === 'true';

    // Download the specific document version
    const blob = await downloadMayanDocumentFileServer(documentId, versionIdNum)
    
    // Get the document to determine filename
    const document = await getMayanDocumentServer(documentId)
    
    let contentType = blob.type;
    if (!contentType || contentType === 'application/octet-stream') {
        contentType = 'application/pdf';
    }
    
    let filename = document.label || `document-${documentId}`;
    filename = `${filename}-v${versionIdNum}.pdf`;

    const dispositionType = forceDownload ? 'attachment' : 'inline';

    // Return the blob with appropriate headers
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${dispositionType}; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error downloading document version:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to download document version'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
