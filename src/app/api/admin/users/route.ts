/**
 * @file src/app/api/admin/users/route.ts
 * @description Admin API endpoint for managing users and verification.
 * Provides user management and verification functionality for admin dashboard.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, parseRequestBody, validatePageNumber, handlePrismaError, ErrorCode } from "@/lib/errorHandler";

/**
 * GET /api/admin/users - Fetch all users with verification status
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 50)
 * - verified: Filter by verification status (true, false)
 * - search: Search by phone or tokenId
 * - sortBy: Sort field (createdAt, phone, isVerified)
 * - sortOrder: Sort direction (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const verified = searchParams.get('verified');
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

    // Validate verified parameter
    let verifiedFilter: boolean | undefined;
    if (verified !== null) {
      if (verified === 'true') {
        verifiedFilter = true;
      } else if (verified === 'false') {
        verifiedFilter = false;
      } else {
        return createErrorResponse(
          'Invalid verified parameter',
          ErrorCode.VALIDATION,
          400,
          { field: 'verified', suggestion: 'Verified must be true or false' }
        );
      }
    }

    // Validate sort parameters
    const validSortFields = ['createdAt', 'phone', 'isVerified', 'updatedAt'];
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
    const where: Record<string, unknown> = {};
    
    if (verifiedFilter !== undefined) {
      where.isVerified = verifiedFilter;
    }
    
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { tokenId: { contains: search } }
      ];
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[sortBy] = sortOrder as 'asc' | 'desc';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch users with order counts
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          orders: {
            select: {
              id: true,
              name: true,
              status: true,
              totalAmount: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          verified: verifiedFilter,
          search,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Admin users fetch error:', error);
    return handlePrismaError(error);
  }
}

/**
 * PATCH /api/admin/users - Bulk verify users
 * Body: { userIds: string[], isVerified: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const parseResult = await parseRequestBody<{ userIds: string[]; isVerified: boolean }>(request);
    if (!parseResult.success) {
      return parseResult.error!;
    }

    const { userIds, isVerified } = parseResult.data!;

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return createErrorResponse(
        'User IDs are required',
        ErrorCode.MISSING_FIELDS,
        400,
        { field: 'userIds', suggestion: 'Provide an array of user IDs to update' }
      );
    }

    if (typeof isVerified !== 'boolean') {
      return createErrorResponse(
        'Verification status is required',
        ErrorCode.MISSING_FIELDS,
        400,
        { field: 'isVerified', suggestion: 'Provide a boolean value for verification status' }
      );
    }

    // Validate user IDs format (CUID)
    for (const userId of userIds) {
      if (typeof userId !== 'string' || userId.length < 10) {
        return createErrorResponse(
          'Invalid user ID format',
          ErrorCode.INVALID_ORDER_ID,
          400,
          { field: 'userIds', suggestion: 'All user IDs must be valid CUIDs' }
        );
      }
    }

    // Perform bulk update
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: {
        isVerified,
        updatedAt: new Date()
      }
    });

    const action = isVerified ? 'verified' : 'unverified';
    return NextResponse.json({
      success: true,
      message: `Successfully ${action} ${result.count} user(s)`,
      data: {
        updatedCount: result.count,
        userIds,
        isVerified
      }
    });

  } catch (error) {
    console.error('Admin bulk user verification error:', error);
    return handlePrismaError(error);
  }
}
