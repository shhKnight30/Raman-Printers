/**
 * @file src/app/api/orders/[id]/files/[fileName]/route.ts
 * @description API endpoint for removing files from orders
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';

/**
 * Removes a file from an order
 * @param request - NextRequest
 * @param params - Route parameters with orderId and fileName
 * @returns NextResponse with removal result
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileName: string } }
) {
  try {
    const { id: orderId, fileName } = params;

    if (!orderId || !fileName) {
      return NextResponse.json(
        { error: 'Order ID and file name are required' },
        { status: 400 }
      );
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is pending
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only remove files from pending orders' },
        { status: 400 }
      );
    }

    // Parse files array
    const files = Array.isArray(order.files) ? order.files : [];
    const fileToRemove = files.find((f: any) => f.name === fileName);

    if (!fileToRemove) {
      return NextResponse.json(
        { error: 'File not found in order' },
        { status: 404 }
      );
    }

    // Remove file from filesystem
    try {
      const filePath = join(process.cwd(), UPLOAD_DIR, order.phone, fileName);
      await unlink(filePath);
    } catch (fileError) {
      console.warn('Failed to delete file from filesystem:', fileError);
      // Continue even if file deletion fails
    }

    // Remove file from order
    const updatedFiles = files.filter((f: any) => f.name !== fileName);

    // If no files left, cancel the order
    if (updatedFiles.length === 0) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          files: [],
          status: 'CANCELLED'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'File removed and order cancelled (no files remaining)',
        orderCancelled: true
      }, { status: 200 });
    }

    // Recalculate total amount based on remaining files
    const totalPages = updatedFiles.reduce((sum: number, f: any) => sum + (f.pages || 1), 0);
    const totalAmount = totalPages * order.copies * 5; // ₹5 per page

    // Update order with remaining files and recalculated amount
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        files: updatedFiles,
        pages: totalPages,
        totalAmount
      }
    });

    return NextResponse.json({
      success: true,
      message: 'File removed successfully',
      order: updatedOrder,
      orderCancelled: false
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to remove file:', error);
    return NextResponse.json(
      { error: 'Failed to remove file' },
      { status: 500 }
    );
  }
}
