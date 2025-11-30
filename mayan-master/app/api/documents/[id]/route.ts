import { NextRequest, NextResponse } from 'next/server'
import { getMayanDocumentServer, getMayanDocumentVersionsServer } from '@/lib/mayanServer'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Debug environment variables
  console.log('MAYAN_BASE_URL:', process.env.MAYAN_BASE_URL)
  console.log('MAYAN_API_TOKEN:', process.env.MAYAN_API_TOKEN)
  
  try {
    const documentId = parseInt(params.id)
    
    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: 'Invalid document ID' },
        { status: 400 }
      )
    }

    // Fetch document metadata and versions in parallel
    const [document, versionsResponse] = await Promise.all([
      getMayanDocumentServer(documentId),
      getMayanDocumentVersionsServer(documentId)
    ])

    // Return combined response
    return NextResponse.json({
      document,
      versions: versionsResponse.results,
      totalVersions: versionsResponse.count
    })
  } catch (error) {
    console.error('Error fetching document details:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch document details'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
