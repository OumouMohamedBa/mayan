import { NextRequest, NextResponse } from 'next/server'
import { createDocument } from '@/lib/mayanServer'

export async function POST(request: NextRequest) {
  try {
    // Debug environment variables
    console.log('MAYAN_BASE_URL:', process.env.MAYAN_BASE_URL)
    console.log('MAYAN_API_TOKEN:', process.env.MAYAN_API_TOKEN ? 'exists' : 'missing')
    
    // Parse multipart form data
    const formData = await request.formData()
    
    // Validate required fields
    const file = formData.get('file') as File
    const documentTypeId = formData.get('document_type_id') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    if (!documentTypeId) {
      return NextResponse.json(
        { error: 'document_type_id is required' },
        { status: 400 }
      )
    }
    
    // Validate file size (optional - adjust limit as needed)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      )
    }
    
    // Create new FormData for Mayan API
    const mayanFormData = new FormData()
    mayanFormData.append('file', file)
    mayanFormData.append('document_type_id', documentTypeId)
    
    // Optional: Add additional metadata if provided
    const description = formData.get('description') as string
    if (description) {
      mayanFormData.append('description', description)
    }
    
    const label = formData.get('label') as string || file.name
    mayanFormData.append('label', label)
    
    // Upload document to Mayan
    const document = await createDocument(mayanFormData)
    
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        label: document.label,
        description: document.description,
        document_type_id: document.document_type_id,
        datetime_created: document.datetime_created,
      }
    })
    
  } catch (error) {
    console.error('Error uploading document:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload document'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
