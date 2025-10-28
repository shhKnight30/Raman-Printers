/**
 * @file src/app/api/admin/orders/[id]/route.ts
 * @description API endpoint for fetching individual order details for admin
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, ErrorCode, validateCuid, handlePrismaError } from "@/lib/errorHandler";

/**
 * GET /api/admin/orders/[id] - Fetch individual order details
 * Path parameters:
 * - id: Order ID (CUID)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

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

    // Fetch order with user details
    let order;
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              phone: true,
              tokenId: true,
              isVerified: true
            }
          }
        }
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

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          name: order.name,
          phone: order.phone,
          pages: order.pages,
          tokenId: order.tokenId,
          copies: order.copies,
          notes: order.notes,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentStatus: order.paymentStatus,
          files: order.files as string[],
          createdAt: order.createdAt,
          user: order.user
        }
      },
      message: 'Order details fetched successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch order details:', error);
    return createErrorResponse(
      'Failed to fetch order details',
      ErrorCode.SERVER,
      500,
      { suggestion: 'Please try again later' }
    );
  }
}
