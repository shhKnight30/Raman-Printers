/**
 * @file src/app/api/orders/route.ts
 * @description API endpoint for managing print orders with full CRUD operations
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  createErrorResponse, 
  ErrorCode, 
  parseRequestBody, 
  validatePhone, 
  validateTokenId,
  validateCuid,
  validateRequiredFields,
  handlePrismaError 
} from '@/lib/errorHandler';

const PRICE_PER_PAGE = 5; // ₹5 per page

/**
 * Creates a new print order
 * @param request - NextRequest with order data
 * @returns NextResponse with order details
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.error!;
    }

    const body = parseResult.data!;
    const { 
      name, 
      phone, 
      copies, 
      notes, 
      pages, // Manual page count from user input
      files, // Array of file descriptors from upload API
      isNewUser, 
      tokenId 
    } = body;

    // Validate required fields
    const requiredFields = ['name', 'phone', 'copies', 'pages', 'files', 'isNewUser'];
    const validation = validateRequiredFields(body, requiredFields);
    if (!validation.valid) {
      return validation.error!;
    }

    // Validate phone number format
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return createErrorResponse(
        phoneValidation.error!,
        ErrorCode.PHONE_INVALID,
        400,
        { field: 'phone' }
      );
    }

    // Validate copies and pages
    if (copies < 1 || pages < 1) {
      return createErrorResponse(
        'Copies and pages must be at least 1',
        ErrorCode.VALIDATION,
        400,
        { field: copies < 1 ? 'copies' : 'pages' }
      );
    }

    // Validate files array
    if (!Array.isArray(files) || files.length === 0) {
      return createErrorResponse(
        'At least one file is required',
        ErrorCode.VALIDATION,
        400,
        { field: 'files' }
      );
    }

    // CRITICAL FIX: Validate tokenId for existing users
    if (!isNewUser) {
      if (!tokenId?.trim()) {
        return createErrorResponse(
          'Token ID is required for existing users. If you are a new user, please check the "I\'m new user" checkbox.',
          ErrorCode.TOKEN_REQUIRED,
          400,
          { 
            field: 'tokenId',
            suggestion: 'Check "I\'m new user" if this is your first order, or enter your existing Token ID'
          }
        );
      }

      const tokenValidation = validateTokenId(tokenId);
      if (!tokenValidation.valid) {
        return createErrorResponse(
          tokenValidation.error!,
          ErrorCode.TOKEN_INVALID,
          400,
          { field: 'tokenId' }
        );
      }
    }

    let user;
    let isNewUserCreated = false;

    if (isNewUser) {
      // CRITICAL FIX: Check if phone already exists for new users
      const existingUser = await prisma.user.findUnique({ 
        where: { phone } 
      });
      
      if (existingUser) {
        return createErrorResponse(
          'This phone number is already registered. Please uncheck "I\'m new user" and enter your Token ID.',
          ErrorCode.PHONE_EXISTS,
          409,
          { 
            field: 'phone',
            suggestion: 'Uncheck "I\'m new user" and enter your existing Token ID'
          }
        );
      }

      // Create new user with token
      const newTokenId = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        user = await prisma.user.create({
          data: {
            phone,
            tokenId: newTokenId,
            isVerified: false
          }
        });
        isNewUserCreated = true;
      } catch (error) {
        return handlePrismaError(error);
      }
    } else {
      // Find existing user by token
      try {
        user = await prisma.user.findUnique({
          where: { tokenId }
        });

        if (!user) {
          return createErrorResponse(
            'Invalid Token ID. Please check your Token ID or contact support if you have forgotten it.',
            ErrorCode.TOKEN_INVALID,
            404,
            { 
              field: 'tokenId',
              suggestion: 'Double-check your Token ID or contact admin for assistance'
            }
          );
        }

        // CRITICAL FIX: Validate tokenId matches phone number
        if (user.phone !== phone) {
          return createErrorResponse(
            'Token ID does not match the phone number provided. Please verify both details.',
            ErrorCode.TOKEN_MISMATCH,
            400,
            { 
              field: 'tokenId',
              suggestion: 'Ensure the Token ID belongs to the phone number you entered'
            }
          );
        }
      } catch (error) {
        return handlePrismaError(error);
      }
    }

    // Calculate total amount
    const totalAmount = pages * copies * PRICE_PER_PAGE;

    // Create the order with error handling
    try {
      const newOrder = await prisma.order.create({
        data: {
          name: name.trim(),
          phone,
          pages,
          tokenId: user.tokenId,
          copies,
          notes: notes?.trim() || null,
          totalAmount,
          files: files, // Array of file descriptors
          userId: user.id,
          status: 'PENDING',
          paymentStatus: 'PENDING'
        }
      });

      return NextResponse.json({
        success: true,
        orderId: newOrder.id,
        tokenId: user.tokenId,
        isNewUser: isNewUserCreated,
        totalAmount,
        message: 'Order created successfully'
      }, { status: 201 });

    } catch (error) {
      return handlePrismaError(error);
    }

  } catch (error) {
    console.error('Order creation failed:', error);
    return createErrorResponse(
      'Failed to create order',
      ErrorCode.SERVER,
      500,
      { suggestion: 'Please try again later' }
    );
  }
}

/**
 * Gets orders with pagination and filtering
 * @param request - NextRequest with query parameters
 * @returns NextResponse with paginated orders
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const tokenId = searchParams.get('tokenId');
    const pageParam = searchParams.get('page') || '1';
    const q = searchParams.get('q') || '';

    // Validate required parameters
    if (!phone || !tokenId) {
      return createErrorResponse(
        'Phone number and Token ID are required',
        ErrorCode.MISSING_FIELDS,
        400,
        { suggestion: 'Please provide both phone number and Token ID to track orders' }
      );
    }

    // Validate phone format
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return createErrorResponse(
        phoneValidation.error!,
        ErrorCode.PHONE_INVALID,
        400,
        { field: 'phone' }
      );
    }

    // Validate page number
    const pageValidation = validatePageNumber(pageParam);
    if (!pageValidation.valid) {
      return createErrorResponse(
        pageValidation.error!,
        ErrorCode.INVALID_PAGE_NUMBER,
        400,
        { field: 'page' }
      );
    }

    const page = pageValidation.value!;

    // Find user by phone and tokenId
    let user;
    try {
      user = await prisma.user.findFirst({
        where: {
          phone,
          tokenId,
        }
      });
    } catch (error) {
      return handlePrismaError(error);
    }

    if (!user) {
      return createErrorResponse(
        'User not found or invalid credentials. Please check your phone number and Token ID.',
        ErrorCode.TOKEN_INVALID,
        404,
        { 
          suggestion: 'Verify your phone number and Token ID are correct' 
        }
      );
    }

    // Build where clause for orders
    const whereClause: any = {
      userId: user.id
    };

    // Add search filter if provided (SQLite doesn't support case-insensitive, so use exact match)
    if (q && q.trim()) {
      whereClause.OR = [
        { name: { contains: q.trim() } },
        { id: { contains: q.trim() } }
      ];
    }

    // Pagination
    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Get orders with pagination
    let orders, totalCount;
    try {
      [orders, totalCount] = await Promise.all([
        prisma.order.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: ITEMS_PER_PAGE
        }),
        prisma.order.count({ where: whereClause })
      ]);
    } catch (error) {
      return handlePrismaError(error);
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return createErrorResponse(
      'Failed to fetch orders',
      ErrorCode.SERVER,
      500,
      { suggestion: 'Please try again later' }
    );
  }
}
function validatePageNumber(page: string) {
  const num = parseInt(page, 10);
  if (isNaN(num) || num < 1) {
    return { valid: false, error: 'Invalid page number' };
  }
  return { valid: true, value: num };
}

/**
 * Updates order status or payment status (admin only)
 * @param request - NextRequest with order ID and updates
 * @returns NextResponse with update result
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    // Parse request body with error handling
    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.error!;
    }

    const { status, paymentStatus } = parseResult.data!;

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

    // Validate at least one field to update
    if (!status && !paymentStatus) {
      return createErrorResponse(
        'Status or paymentStatus is required',
        ErrorCode.MISSING_FIELDS,
        400,
        { suggestion: 'Provide either status or paymentStatus to update' }
      );
    }

    // Validate status values
    const validStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
    const validPaymentStatuses = ['PENDING', 'PAID', 'VERIFIED'];

    if (status && !validStatuses.includes(status)) {
      return createErrorResponse(
        `Invalid status value. Valid values: ${validStatuses.join(', ')}`,
        ErrorCode.VALIDATION,
        400,
        { field: 'status' }
      );
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return createErrorResponse(
        `Invalid paymentStatus value. Valid values: ${validPaymentStatuses.join(', ')}`,
        ErrorCode.VALIDATION,
        400,
        { field: 'paymentStatus' }
      );
    }

    // Update order with error handling
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    console.log('Updating order with:', { orderId, updateData });

    let updatedOrder;
    try {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData
      });
      console.log('Order updated successfully:', updatedOrder);
    } catch (error) {
      console.error('Prisma update error:', error);
      // Handle Prisma RecordNotFound error
      if (error.code === 'P2025') {
        return createErrorResponse(
          'Order not found',
          ErrorCode.ORDER_NOT_FOUND,
          404,
          { suggestion: 'Check if the order ID is correct' }
        );
      }
      return handlePrismaError(error);
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to update order:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return createErrorResponse(
      `Failed to update order: ${error.message}`,
      ErrorCode.SERVER,
      500,
      { suggestion: 'Please try again later', details: error.message }
    );
  }
}
