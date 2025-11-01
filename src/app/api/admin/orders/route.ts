/**
 * @file src/app/api/admin/orders/route.ts
 * @description Admin API endpoint for managing orders with filters and pagination.
 * Provides comprehensive order management for admin dashboard.
 */
import { ErrorCode } from "@/lib/errorHandler";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, parseRequestBody, validatePageNumber, handlePrismaError } from "@/lib/errorHandler";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/orders - Fetch all orders with filters and pagination
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 50)
 * - status: Filter by order status (PENDING, COMPLETED, CANCELLED)
 * - paymentStatus: Filter by payment status (PENDING, PAID, VERIFIED)
 * - search: Search by name, phone, or tokenId
 * - sortBy: Sort field (createdAt, totalAmount, status)
 * - sortOrder: Sort direction (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const status = searchParams.get('status') as 'PENDING' | 'COMPLETED' | 'CANCELLED' | null;
    const paymentStatus = searchParams.get('paymentStatus') as 'PENDING' | 'PAID' | 'VERIFIED' | null;
    const search = searchParams.get('search')?.trim() || null;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate page number
    const pageValidation = validatePageNumber(page);
    if (!pageValidation.valid) {
      return createErrorResponse(
        pageValidation.error!,
        ErrorCode.INVALID_PAGE_NUMBER,
        400,
        { field: 'page', suggestion: 'Page must be a positive integer' }
      );
    }

    // Validate status values
    if (status && !['PENDING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return createErrorResponse(
        'Invalid order status',
        ErrorCode.INVALID_STATUS,
        400,
        { field: 'status', suggestion: 'Status must be PENDING, COMPLETED, or CANCELLED' }
      );
    }

    // Validate payment status values
    if (paymentStatus && !['PENDING', 'PAID', 'VERIFIED'].includes(paymentStatus)) {
      return createErrorResponse(
        'Invalid payment status',
        ErrorCode.INVALID_PAYMENT_STATUS,
        400,
        { field: 'paymentStatus', suggestion: 'Payment status must be PENDING, PAID, or VERIFIED' }
      );
    }

    // Validate sort parameters
    const validSortFields = ['createdAt', 'totalAmount', 'status', 'paymentStatus'];
    if (!validSortFields.includes(sortBy)) {
      return createErrorResponse(
        'Invalid sort field',
        ErrorCode.INVALID_SORT_FIELD,
        400,
        { field: 'sortBy', suggestion: `Sort field must be one of: ${validSortFields.join(', ')}` }
      );
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      return createErrorResponse(
        'Invalid sort order',
        ErrorCode.INVALID_SORT_ORDER,
        400,
        { field: 'sortOrder', suggestion: 'Sort order must be asc or desc' }
      );
    }

    // Build where clause
    const where: Prisma.OrderWhereInput = {};
    
    if (status) {
      where.status = status;
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { tokenId: { contains: search } }
      ];
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[sortBy] = sortOrder as 'asc' | 'desc';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch orders with user data
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              phone: true,
              tokenId: true,
              isVerified: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          status,
          paymentStatus,
          search,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Admin orders fetch error:', error);
    return handlePrismaError(error);
  }
}

/**
 * PATCH /api/admin/orders - Bulk update orders (for admin operations)
 * Body: { orderIds: string[], updates: { status?: string, paymentStatus?: string } }
 */
export async function PATCH(request: NextRequest) {
  try {
    const parseResult = await parseRequestBody<{ orderIds: string[]; updates: Record<string, unknown> }>(request);
    if (!parseResult.success) {
      return parseResult.error!;
    }

    const { orderIds, updates } = parseResult.data!;

    // Validate required fields
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return createErrorResponse(
        'Order IDs are required',
        ErrorCode.INVALID_ORDER_ID,
        400,
        { field: 'orderIds', suggestion: 'Provide an array of order IDs to update' }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return createErrorResponse(
        'Updates object is required',
        ErrorCode.MISSING_UPDATES,
        400,
        { field: 'updates', suggestion: 'Provide an object with status and/or paymentStatus' }
      );
    }

    // Validate order IDs format (CUID)
    for (const orderId of orderIds) {
      if (typeof orderId !== 'string' || orderId.length < 10) {
        return createErrorResponse(
          'Invalid order ID format',
          ErrorCode.INVALID_ORDER_ID,
          400,
          { field: 'orderIds', suggestion: 'All order IDs must be valid CUIDs' }
        );
      }
    }

    // Validate status values
    if (updates.status && typeof updates.status === 'string' && !['PENDING', 'COMPLETED', 'CANCELLED'].includes(updates.status)) {
      return createErrorResponse(
        'Invalid order status',
        ErrorCode.INVALID_STATUS,
        400,
        { field: 'updates.status', suggestion: 'Status must be PENDING, COMPLETED, or CANCELLED' }
      );
    }

    // Validate payment status values
    if (updates.paymentStatus && typeof updates.paymentStatus === 'string' && !['PENDING', 'PAID', 'VERIFIED'].includes(updates.paymentStatus)) {
      return createErrorResponse(
        'Invalid payment status',
        ErrorCode.INVALID_PAYMENT_STATUS,
        400,
        { field: 'updates.paymentStatus', suggestion: 'Payment status must be PENDING, PAID, or VERIFIED' }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.paymentStatus) updateData.paymentStatus = updates.paymentStatus;
    updateData.updatedAt = new Date();

    // Perform bulk update
    const result = await prisma.order.updateMany({
      where: {
        id: {
          in: orderIds
        }
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.count} order(s)`,
      data: {
        updatedCount: result.count,
        orderIds,
        updates: updateData
      }
    });

  } catch (error) {
    console.error('Admin bulk order update error:', error);
    return handlePrismaError(error);
  }
}
