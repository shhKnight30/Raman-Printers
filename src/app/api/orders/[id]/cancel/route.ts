/**
 * @file src/app/api/orders/[id]/cancel/route.ts
 * @description API endpoint for cancelling orders
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Cancels an order (only if pending)
 * @param request - NextRequest
 * @param params - Route parameters with orderId
 * @returns NextResponse with cancellation result
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
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

    // Check if order can be cancelled
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { 
          error: 'Order cannot be cancelled',
          currentStatus: order.status,
          message: 'Only pending orders can be cancelled'
        },
        { status: 400 }
      );
    }

    // Update order status to cancelled
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      order: cancelledOrder,
      message: 'Order cancelled successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to cancel order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
