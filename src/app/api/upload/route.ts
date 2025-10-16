/**
 * @file src/app/api/upload/route.ts
 * @description Multipart file upload API for storing files in public/uploads/<phone>/
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

/**
 * Sanitizes filename to prevent path traversal attacks
 * @param filename - Original filename
 * @returns Sanitized filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 100); // Limit length
}

/**
 * Handles multipart file upload
 * @param request - NextRequest with FormData
 * @returns NextResponse with file descriptors
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    const formData = await request.formData();
    const phone = formData.get('phone') as string;
    const files = formData.getAll('files') as File[];

    console.log('Phone:', phone);
    console.log('Files count:', files.length);

    if (!phone || !/^\d{10}$/.test(phone)) {
      console.log('Invalid phone number:', phone);
      return NextResponse.json(
        { error: 'Valid 10-digit phone number is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      console.log('No files provided');
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      console.log('Too many files:', files.length);
      return NextResponse.json(
        { error: 'Maximum 10 files allowed' },
        { status: 400 }
      );
    }

    // Create user directory
    const userDir = join(process.cwd(), UPLOAD_DIR, phone);
    console.log('User directory:', userDir);
    
    if (!existsSync(userDir)) {
      console.log('Creating user directory');
      await mkdir(userDir, { recursive: true });
    }

    const fileDescriptors: Array<{
      name: string;
      path: string;
      size: number;
      type: string;
      pages: number;
    }> = [];

    for (const file of files) {
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        console.log(`File type not supported: ${file.type}`);
        return NextResponse.json(
          { error: `File type ${file.type} not supported. Allowed: PDF, images, Word, PowerPoint` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        console.log(`File too large: ${file.name}, size: ${file.size}`);
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }

      // Sanitize filename
      const sanitizedName = sanitizeFilename(file.name);
      const filePath = join(userDir, sanitizedName);
      console.log(`Saving file to: ${filePath}`);

      // Write file
      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));
      console.log(`File saved successfully: ${sanitizedName}`);

      // Calculate pages (simplified: 1 page per file for now)
      const pages = 1; // TODO: Implement actual page counting for PDFs

      fileDescriptors.push({
        name: sanitizedName,
        path: `/uploads/${phone}/${sanitizedName}`,
        size: file.size,
        type: file.type,
        pages
      });
    }

    return NextResponse.json({
      success: true,
      files: fileDescriptors,
      message: `${files.length} file(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
