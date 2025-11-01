/**
 * @file src/lib/errorHandler.ts
 * @description Centralized error handling utility for API routes
 * Provides standardized error responses, validation helpers, and request parsing
 */

import { NextResponse } from 'next/server';

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  AUTH = 'AUTH',
  NOT_FOUND = 'NOT_FOUND',
  FILE_UPLOAD = 'FILE_UPLOAD',
  PERMISSION = 'PERMISSION',
  SERVER = 'SERVER'
}

/**
 * Error codes for client-side handling
 */
export enum ErrorCode {
  TOKEN_REQUIRED = 'TOKEN_REQUIRED',
  PHONE_EXISTS = 'PHONE_EXISTS',
  PHONE_INVALID = 'PHONE_INVALID',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_MISMATCH = 'TOKEN_MISMATCH',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TYPE_INVALID = 'FILE_TYPE_INVALID',
  DUPLICATE_FILE = 'DUPLICATE_FILE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_JSON = 'INVALID_JSON',
  MISSING_FIELDS = 'MISSING_FIELDS',
  INVALID_PAGE_NUMBER = 'INVALID_PAGE_NUMBER',
  ORDER_CANNOT_CANCEL = 'ORDER_CANNOT_CANCEL',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  MISSING_UPDATES = 'MISSING_UPDATES',
  INVALID_ORDER_ID = 'INVALID_ORDER_ID',
  INVALID_STATUS = 'INVALID_STATUS',
  INVALID_PAYMENT_STATUS = 'INVALID_PAYMENT_STATUS',
  INVALID_SORT_FIELD = 'INVALID_SORT_FIELD',
  INVALID_SORT_ORDER = 'INVALID_SORT_ORDER',
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  DATABASE_OPERATION_FAILED = 'DATABASE_OPERATION_FAILED',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  FILE_SIZE_EXCEEDS_LIMIT = 'FILE_SIZE_EXCEEDS_LIMIT',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  DATABASE = 'DATABASE',
  AUTH = 'AUTH'
}

/**
 * Standardized error response interface
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  field?: string;
  suggestion?: string;
  details?: unknown;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  code: ErrorCode,
  status: number = 400,
  options?: {
    field?: string;
    suggestion?: string;
    details?: unknown;
  }
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      ...options
    },
    { status }
  );
}

/**
 * Validation helper functions
 */

/**
 * Validates phone number format
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (!/^\d{10}$/.test(cleanPhone)) {
    return { 
      valid: false, 
      error: 'Please enter a valid 10-digit mobile number' 
    };
  }
  
  return { valid: true };
}

/**
 * Validates token ID format
 */
export function validateTokenId(tokenId: string): { valid: boolean; error?: string } {
  if (!tokenId || typeof tokenId !== 'string') {
    return { valid: false, error: 'Token ID is required' };
  }
  
  const trimmed = tokenId.trim();
  if (trimmed.length < 10) {
    return { 
      valid: false, 
      error: 'Token ID appears to be invalid' 
    };
  }
  
  return { valid: true };
}

/**
 * Validates page number
 */
export function validatePageNumber(page: unknown): { valid: boolean; value?: number; error?: string } {
  if (page === undefined || page === null) {
    return { valid: false, error: 'Page number is required' };
  }
  
  const num = parseInt(String(page));
  if (isNaN(num) || num < 1) {
    return { 
      valid: false, 
      error: 'Page number must be a positive integer' 
    };
  }
  
  return { valid: true, value: num };
}

/**
 * Validates CUID format (for order IDs)
 */
export function validateCuid(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID is required' };
  }
  
  // Basic CUID validation (starts with 'c' and is 25 characters)
  if (!/^c[a-z0-9]{24}$/.test(id)) {
    return { 
      valid: false, 
      error: 'Invalid ID format' 
    };
  }
  
  return { valid: true };
}

/**
 * Validates file extension
 */
export function validateFileExtension(filename: string): { valid: boolean; error?: string } {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Filename is required' };
  }
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(ext)) {
    return { 
      valid: false, 
      error: `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}` 
    };
  }
  
  return { valid: true };
}

/**
 * Safely parses request body with error handling
 */
export async function parseRequestBody<T = unknown>(request: Request): Promise<{
  success: boolean;
  data?: T;
  error?: NextResponse<ErrorResponse>;
}> {
  try {
    const body = await request.json();
    return { success: true, data: body };
  } catch {
    return {
      success: false,
      error: createErrorResponse(
        'Invalid JSON in request body',
        ErrorCode.INVALID_JSON,
        400,
        { suggestion: 'Please check your request format' }
      )
    };
  }
}

/**
 * Safely parses FormData with error handling
 */
export async function parseFormData(request: Request): Promise<{
  success: boolean;
  data?: FormData;
  error?: NextResponse<ErrorResponse>;
}> {
  try {
    const formData = await request.formData();
    return { success: true, data: formData };
  } catch {
    return {
      success: false,
      error: createErrorResponse(
        'Failed to parse form data',
        ErrorCode.INVALID_JSON,
        400,
        { suggestion: 'Please check your file upload format' }
      )
    };
  }
}

/**
 * Handles Prisma errors and converts to user-friendly messages
 */
export function handlePrismaError(error: unknown): NextResponse<ErrorResponse> {
  console.error('Prisma error:', error);
  
  const prismaError = error as { code?: string; meta?: { target?: string[] } };
  
  // Unique constraint violation
  if (prismaError.code === 'P2002') {
    const field = prismaError.meta?.target?.[0] || 'field';
    return createErrorResponse(
      `This ${field} is already in use`,
      field === 'phone' ? ErrorCode.PHONE_EXISTS : ErrorCode.DUPLICATE_FILE,
      409,
      { 
        suggestion: field === 'phone' 
          ? 'If you are an existing user, please uncheck "I\'m new user" and enter your Token ID'
          : 'Please use a different filename'
      }
    );
  }
  
  // Record not found
  if (prismaError.code === 'P2025') {
    return createErrorResponse(
      'Record not found',
      ErrorCode.ORDER_NOT_FOUND,
      404
    );
  }
  
  // Foreign key constraint
  if (prismaError.code === 'P2003') {
    return createErrorResponse(
      'Invalid reference',
      ErrorCode.INVALID_REFERENCE,
      400
    );
  }
  
  // Generic database error
  return createErrorResponse(
    'Database operation failed',
    ErrorCode.DATABASE_OPERATION_FAILED,
    500,
    { suggestion: 'Please try again later' }
  );
}

/**
 * Validates required fields in an object
 */
export function validateRequiredFields(
  data: Record<string, unknown>, 
  requiredFields: string[]
): { valid: boolean; missingFields?: string[]; error?: NextResponse<ErrorResponse> } {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || 
           (typeof value === 'string' && !value.trim());
  });
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      missingFields,
      error: createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        ErrorCode.MISSING_FIELDS,
        400,
        { 
          field: missingFields[0],
          suggestion: 'Please fill in all required fields' 
        }
      )
    };
  }
  
  return { valid: true };
}

/**
 * Sanitizes filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 100); // Limit length
}

/**
 * Validates file size
 */
export function validateFileSize(size: number, maxSizeMB: number = 10): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }
  
  return { valid: true };
}
