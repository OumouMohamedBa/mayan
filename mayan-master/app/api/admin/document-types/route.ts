import { NextRequest, NextResponse } from 'next/server'
import { listDocumentTypes } from '@/lib/mayanServer'

export async function GET(request: NextRequest) {
  try {
    // Debug environment variables
    console.log('MAYAN_BASE_URL:', process.env.MAYAN_BASE_URL)
    console.log('MAYAN_API_TOKEN:', process.env.MAYAN_API_TOKEN ? 'exists' : 'missing')
    
    const documentTypes = await listDocumentTypes()
    
    return NextResponse.json({
      success: true,
      document_types: documentTypes.results || []
    })
    
  } catch (error) {
    console.error('Error fetching document types:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch document types'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
