/**
 * @file src/app/api/orders/[id]/files/[fileName]/route.ts
 * @description API endpoint for removing files from orders
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { 
  createErrorResponse, 
  ErrorCode, 
  validateCuid,
  sanitizeFilename,
  handlePrismaError 
} from '@/lib/errorHandler';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';

/**
 * Removes a file from an order
 * @param request - NextRequest
 * @param params - Route parameters with orderId and fileName
 * @returns NextResponse with removal result
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileName: string }> }
) {
  try {
    const { id: orderId, fileName } = await params;

    // Validate required parameters
    if (!orderId || !fileName) {
      return createErrorResponse(
        'Order ID and file name are required',
        ErrorCode.MISSING_FIELDS,
        400,
        { suggestion: 'Please provide both order ID and file name' }
      );
    }

    // Validate order ID format
    const orderIdValidation = validateCuid(orderId);
    if (!orderIdValidation.valid) {
      return createErrorResponse(
        orderIdValidation.error!,
        ErrorCode.VALIDATION,
        400,
        { field: 'id' }
      );
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFileName = sanitizeFilename(fileName);
    if (sanitizedFileName !== fileName) {
      return createErrorResponse(
        'Invalid file name format',
        ErrorCode.VALIDATION,
        400,
        { suggestion: 'File name contains invalid characters' }
      );
    }

    // Get the order with error handling
    let order;
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId }
      });
    } catch (error) {
      return handlePrismaError(error);
    }

    if (!order) {
      return createErrorResponse(
        'Order not found',
        ErrorCode.ORDER_NOT_FOUND,
        404,
        { suggestion: 'Check if the order ID is correct' }
      );
    }

    // Check if order is pending
    if (order.status !== 'PENDING') {
      return createErrorResponse(
        'Can only remove files from pending orders',
        ErrorCode.ORDER_CANNOT_CANCEL,
        400,
        { 
          details: { currentStatus: order.status },
          suggestion: 'Only pending orders allow file removal'
        }
      );
    }

    // Parse files array safely
    interface FileDescriptor {
      name: string;
      pages?: number;
    }
    let files: FileDescriptor[] = [];
    try {
      if (Array.isArray(order.files)) {
        files = order.files as unknown as FileDescriptor[];
      }
    } catch {
      return createErrorResponse(
        'Invalid file data in order',
        ErrorCode.VALIDATION,
        400,
        { suggestion: 'Order file data is corrupted' }
      );
    }

    const fileToRemove = files.find((f) => f.name === fileName);

    if (!fileToRemove) {
      return createErrorResponse(
        'File not found in order',
        ErrorCode.NOT_FOUND,
        404,
        { suggestion: 'Check if the file name is correct' }
      );
    }

    // Remove file from storage with error handling (local or Vercel Blob)
    let fileDeleted = false;
    try {
      const USE_BLOB = (process.env.STORAGE_DRIVER || '').toLowerCase() === 'blob' || !!process.env.VERCEL;
      const descriptor = fileToRemove as unknown as { name: string; path?: string };

      if (USE_BLOB && descriptor.path && /^https?:\/\//i.test(descriptor.path)) {
        try {
          const { del } = await import('@vercel/blob');
          await del(descriptor.path, { token: process.env.RAMAN_BLOB_READ_WRITE_TOKEN });
          fileDeleted = true;
        } catch (blobErr) {
          console.warn('Failed to delete file from Vercel Blob:', blobErr);
        }
      } else {
        const filePath = join(process.cwd(), UPLOAD_DIR, order.phone, fileName);
        await unlink(filePath);
        fileDeleted = true;
      }
    } catch (fileError) {
      console.warn('Failed to delete file from storage:', fileError);
      // Continue with database update even if file deletion fails
    }

    // Remove file from order
    const updatedFiles = files.filter((f) => f.name !== fileName);

    // If no files left, cancel the order
    if (updatedFiles.length === 0) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            files: [],
            status: 'CANCELLED'
          }
        });
      } catch (error) {
        return handlePrismaError(error);
      }

      return NextResponse.json({
        success: true,
        message: 'File removed and order cancelled (no files remaining)',
        orderCancelled: true,
        fileDeleted
      }, { status: 200 });
    }

    // Recalculate total amount based on remaining files
    const totalPages = updatedFiles.reduce((sum, f) => sum + (f.pages || 1), 0);
    const totalAmount = totalPages * order.copies * 5; // ₹5 per page

    // Update order with remaining files and recalculated amount
    let updatedOrder;
    try {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          files: updatedFiles as unknown as Prisma.InputJsonValue,
          pages: totalPages,
          totalAmount
        }
      });
    } catch (error) {
      return handlePrismaError(error);
    }

    return NextResponse.json({
      success: true,
      message: 'File removed successfully',
      order: updatedOrder,
      orderCancelled: false,
      fileDeleted
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to remove file:', error);
    return createErrorResponse(
      'Failed to remove file',
      ErrorCode.SERVER,
      500,
      { suggestion: 'Please try again later' }
    );
  }
}
