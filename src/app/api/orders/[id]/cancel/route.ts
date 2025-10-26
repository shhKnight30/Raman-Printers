/**
 * @file src/app/api/orders/[id]/cancel/route.ts
 * @description API endpoint for cancelling orders
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  createErrorResponse, 
  ErrorCode, 
  validateCuid,
  handlePrismaError 
} from '@/lib/errorHandler';

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

    // Validate order ID
    if (!orderId) {
      return createErrorResponse(
        'Order ID is required',
        ErrorCode.MISSING_FIELDS,
        400,
        { field: 'id' }
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

    // Check if order can be cancelled
    if (order.status !== 'PENDING') {
      return createErrorResponse(
        'Order cannot be cancelled',
        ErrorCode.ORDER_CANNOT_CANCEL,
        400,
        { 
          details: { currentStatus: order.status },
          suggestion: order.status === 'COMPLETED' 
            ? 'This order has already been completed'
            : order.status === 'CANCELLED'
            ? 'This order has already been cancelled'
            : 'Only pending orders can be cancelled'
        }
      );
    }

    // Check if payment is completed - require admin contact
    if (order.paymentStatus === 'VERIFIED' || order.paymentStatus === 'PAID') {
      return createErrorResponse(
        'Cannot cancel paid order',
        ErrorCode.PAYMENT_REQUIRED,
        400,
        { 
          suggestion: 'Please contact admin to cancel this order as payment has been processed'
        }
      );
    }

    // Update order status to cancelled with error handling
    let cancelledOrder;
    try {
      cancelledOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      return handlePrismaError(error);
    }

    return NextResponse.json({
      success: true,
      order: cancelledOrder,
      message: 'Order cancelled successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to cancel order:', error);
    return createErrorResponse(
      'Failed to cancel order',
      ErrorCode.SERVER,
      500,
      { suggestion: 'Please try again later' }
    );
  }
}
