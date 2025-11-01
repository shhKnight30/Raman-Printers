/**
 * @file src/app/api/upload/route.ts
 * @description Multipart file upload API for storing files in public/uploads/<phone>/
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import path from 'path';
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
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total per upload
const UPLOAD_TIMEOUT = parseInt(process.env.UPLOAD_TIMEOUT || '60') * 1000; // 60 seconds default
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
 * Handles multipart file upload
 * @param request - NextRequest with FormData
 * @returns NextResponse with file descriptors
 */
export async function POST(request: NextRequest) {
  // Create a timeout promise that rejects after UPLOAD_TIMEOUT
  const uploadTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Upload timeout')), UPLOAD_TIMEOUT);
  });

  try {
    console.log('Upload API called with timeout:', UPLOAD_TIMEOUT / 1000, 'seconds');
    
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
        ErrorCode.VALIDATION,
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

    // Runtime storage decision: Vercel Blob in prod, local disk in dev
    const USE_BLOB = (process.env.STORAGE_DRIVER || '').toLowerCase() === 'blob' || !!process.env.VERCEL;

    const fileDescriptors: Array<{
      name: string;
      path: string;
      size: number;
      type: string;
      pages: number;
    }> = [];

    if (!USE_BLOB) {
      // LOCAL DISK (development)
      const userDir = join(process.cwd(), UPLOAD_DIR, phone);
      console.log('Using local storage:', userDir);

      try {
        if (!existsSync(userDir)) {
          await mkdir(userDir, { recursive: true });
        }
      } catch (error) {
        console.error('Failed to create directory:', error);
        return createErrorResponse('Failed to create upload directory', ErrorCode.VALIDATION, 500, { suggestion: 'Please try again later' });
      }

      for (const file of files) {
        console.log(`Processing file (local): ${file.name}`);

        if (!file.name || file.name.trim() === '') {
          return createErrorResponse('File name is required', ErrorCode.VALIDATION, 400, { suggestion: 'Please ensure all files have valid names' });
        }
        const extValidation = validateFileExtension(file.name);
        if (!extValidation.valid) {
          return createErrorResponse(extValidation.error!, ErrorCode.FILE_TYPE_INVALID, 400, { suggestion: 'Please use supported file types: PDF, DOC, DOCX, JPG, PNG' });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          return createErrorResponse(`File type ${file.type} not supported`, ErrorCode.FILE_TYPE_INVALID, 400, { suggestion: 'Please convert your file to a supported format' });
        }
        const sizeValidation = validateFileSize(file.size, 10);
        if (!sizeValidation.valid) {
          return createErrorResponse(`File ${file.name} ${sizeValidation.error}`, ErrorCode.FILE_TOO_LARGE, 400, { suggestion: 'Please compress or split large files' });
        }

        const sanitizedName = sanitizeFilename(file.name);
        const fileExtension = path.extname(sanitizedName);
        const baseName = path.basename(sanitizedName, fileExtension);
        let finalFileName = sanitizedName;
        let counter = 1;
        while (existsSync(join(userDir, finalFileName))) {
          finalFileName = `${baseName} (${counter})${fileExtension}`;
          counter++;
        }

        const filePath = join(userDir, finalFileName);
        try {
          const bytes = await Promise.race([file.arrayBuffer(), uploadTimeout]);
          await Promise.race([writeFile(filePath, Buffer.from(bytes as ArrayBuffer)), uploadTimeout]);
          console.log(`File saved: ${finalFileName}`);
        } catch (error: unknown) {
          const err = error as Error;
          if (err.message === 'Upload timeout') {
            return createErrorResponse(`Upload timed out after ${UPLOAD_TIMEOUT / 1000} seconds`, ErrorCode.VALIDATION, 408, { suggestion: 'Please try with smaller files or check your connection' });
          }
          return createErrorResponse(`Failed to save file ${sanitizedName}`, ErrorCode.VALIDATION, 500, { suggestion: 'Please try again or contact support' });
        }

        fileDescriptors.push({
          name: finalFileName,
          path: `/uploads/${phone}/${finalFileName}`,
          size: file.size,
          type: file.type,
          pages: 1,
        });
      }
    } else {
      // VERCEL BLOB (production)
      console.log('Using Vercel Blob storage');
      const { put } = await import('@vercel/blob');

      for (const file of files) {
        console.log(`Processing file (blob): ${file.name}`);

        if (!file.name || file.name.trim() === '') {
          return createErrorResponse('File name is required', ErrorCode.VALIDATION, 400, { suggestion: 'Please ensure all files have valid names' });
        }
        const extValidation = validateFileExtension(file.name);
        if (!extValidation.valid) {
          return createErrorResponse(extValidation.error!, ErrorCode.FILE_TYPE_INVALID, 400, { suggestion: 'Please use supported file types: PDF, DOC, DOCX, JPG, PNG' });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          return createErrorResponse(`File type ${file.type} not supported`, ErrorCode.FILE_TYPE_INVALID, 400, { suggestion: 'Please convert your file to a supported format' });
        }
        const sizeValidation = validateFileSize(file.size, 10);
        if (!sizeValidation.valid) {
          return createErrorResponse(`File ${file.name} ${sizeValidation.error}`, ErrorCode.FILE_TOO_LARGE, 400, { suggestion: 'Please compress or split large files' });
        }

        const sanitizedName = sanitizeFilename(file.name);
        const blobKey = `${phone}/${sanitizedName}`;

        try {
          const bytes = await Promise.race([file.arrayBuffer(), uploadTimeout]);
          const blobResult = await Promise.race([
            put(blobKey, bytes as ArrayBuffer, {
              access: 'public',
              addRandomSuffix: true,
              contentType: file.type || 'application/octet-stream',
              token: process.env.BLOB_READ_WRITE_TOKEN,
            }),
            uploadTimeout,
          ]) as { url: string };

          console.log(`File uploaded to Blob: ${blobResult.url}`);
          fileDescriptors.push({
            name: sanitizedName,
            path: blobResult.url,
            size: file.size,
            type: file.type,
            pages: 1,
          });
        } catch (error: unknown) {
          const err = error as Error;
          if (err.message === 'Upload timeout') {
            return createErrorResponse(`Upload timed out after ${UPLOAD_TIMEOUT / 1000} seconds`, ErrorCode.VALIDATION, 408, { suggestion: 'Please try with smaller files or check your connection' });
          }
          console.error('Blob upload error:', err);
          return createErrorResponse('Failed to upload file to blob storage', ErrorCode.SERVER, 500, { suggestion: 'Please try again later' });
        }
      }
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
