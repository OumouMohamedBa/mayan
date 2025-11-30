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

    // Download the specific document version
    const blob = await downloadMayanDocumentFileServer(documentId, versionIdNum)
    
    // Get the document to determine filename
    const document = await getMayanDocumentServer(documentId)
    
    // Return the blob with appropriate headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.latest_version?.file_filename || `document-${documentId}-v${versionIdNum}`}"`,
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
