import { NextRequest, NextResponse } from 'next/server'
import { listMayanDocumentsServer } from '@/lib/mayanServer'

export async function GET(request: NextRequest) {
  // Debug environment variables
  console.log('MAYAN_BASE_URL:', process.env.MAYAN_BASE_URL)
  console.log('MAYAN_API_TOKEN:', process.env.MAYAN_API_TOKEN)
  
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const response = await listMayanDocumentsServer(query, page, pageSize)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching documents:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch documents'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
