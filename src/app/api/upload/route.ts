/**
 * @file src/app/api/upload/route.ts
 * @description Multipart file upload API for storing files in public/uploads/<phone>/
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { 
  createErrorResponse, 
  ErrorCode, 
  parseFormData, 
  validatePhone,
  sanitizeFilename,
  validateFileSize,
  validateFileExtension
} from '@/lib/errorHandler';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total per upload
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
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

/**
 * Handles multipart file upload
 * @param request - NextRequest with FormData
 * @returns NextResponse with file descriptors
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    
    // Parse FormData with error handling
    const parseResult = await parseFormData(request);
    if (!parseResult.success) {
      return parseResult.error!;
    }

    const formData = parseResult.data!;
    const phone = formData.get('phone') as string;
    const files = formData.getAll('files') as File[];

    console.log('Phone:', phone);
    console.log('Files count:', files.length);

    // Validate phone number
    if (!phone) {
      return createErrorResponse(
        'Phone number is required',
        ErrorCode.MISSING_FIELDS,
        400,
        { field: 'phone' }
      );
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return createErrorResponse(
        phoneValidation.error!,
        ErrorCode.PHONE_INVALID,
        400,
        { field: 'phone' }
      );
    }

    // Validate files
    if (!files || files.length === 0) {
      return createErrorResponse(
        'No files provided',
        ErrorCode.MISSING_FIELDS,
        400,
        { field: 'files' }
      );
    }

    if (files.length > 10) {
      return createErrorResponse(
        'Maximum 10 files allowed per upload',
        ErrorCode.FILE_UPLOAD,
        400,
        { suggestion: 'Please select up to 10 files' }
      );
    }

    // Validate total upload size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return createErrorResponse(
        `Total upload size exceeds ${MAX_TOTAL_SIZE / (1024 * 1024)}MB limit`,
        ErrorCode.FILE_TOO_LARGE,
        400,
        { suggestion: 'Please reduce the number or size of files' }
      );
    }

    // Create user directory with error handling
    const userDir = join(process.cwd(), UPLOAD_DIR, phone);
    console.log('User directory:', userDir);
    
    try {
      if (!existsSync(userDir)) {
        console.log('Creating user directory');
        await mkdir(userDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create directory:', error);
      return createErrorResponse(
        'Failed to create upload directory',
        ErrorCode.FILE_UPLOAD,
        500,
        { suggestion: 'Please try again later' }
      );
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
      
      // Validate file name
      if (!file.name || file.name.trim() === '') {
        return createErrorResponse(
          'File name is required',
          ErrorCode.FILE_UPLOAD,
          400,
          { suggestion: 'Please ensure all files have valid names' }
        );
      }

      // Validate file extension
      const extValidation = validateFileExtension(file.name);
      if (!extValidation.valid) {
        return createErrorResponse(
          extValidation.error!,
          ErrorCode.FILE_TYPE_INVALID,
          400,
          { suggestion: 'Please use supported file types: PDF, DOC, DOCX, JPG, PNG' }
        );
      }

      // Validate file type (MIME type)
      if (!ALLOWED_TYPES.includes(file.type)) {
        return createErrorResponse(
          `File type ${file.type} not supported. Allowed types: PDF, images, Word, PowerPoint`,
          ErrorCode.FILE_TYPE_INVALID,
          400,
          { suggestion: 'Please convert your file to a supported format' }
        );
      }

      // Validate file size
      const sizeValidation = validateFileSize(file.size, 10);
      if (!sizeValidation.valid) {
        return createErrorResponse(
          `File ${file.name} ${sizeValidation.error}`,
          ErrorCode.FILE_TOO_LARGE,
          400,
          { suggestion: 'Please compress or split large files' }
        );
      }

      // Sanitize filename
      const sanitizedName = sanitizeFilename(file.name);
      const filePath = join(userDir, sanitizedName);
      
      // Check for duplicate filename
      if (existsSync(filePath)) {
        return createErrorResponse(
          `A file with the name "${sanitizedName}" already exists. Please rename your file.`,
          ErrorCode.DUPLICATE_FILE,
          409,
          { suggestion: 'Rename your file and try again' }
        );
      }

      console.log(`Saving file to: ${filePath}`);

      // Write file with error handling
      try {
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));
        console.log(`File saved successfully: ${sanitizedName}`);
      } catch (error) {
        console.error(`Failed to save file ${sanitizedName}:`, error);
        return createErrorResponse(
          `Failed to save file ${sanitizedName}`,
          ErrorCode.FILE_UPLOAD,
          500,
          { suggestion: 'Please try again or contact support' }
        );
      }

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
    return createErrorResponse(
      'Failed to upload files',
      ErrorCode.SERVER,
      500,
      { suggestion: 'Please try again later' }
    );
  }
}
