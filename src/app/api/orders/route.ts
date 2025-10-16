/**
 * @file src/app/api/orders/route.ts
 * @description API endpoint for managing print orders with full CRUD operations
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const PRICE_PER_PAGE = 5; // ₹5 per page

/**
 * Creates a new print order
 * @param request - NextRequest with order data
 * @returns NextResponse with order details
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    // Validation
    if (!name?.trim() || !phone?.trim() || !copies || !pages) {
      return NextResponse.json(
        { error: 'Name, phone, copies, and pages are required' },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (copies < 1 || pages < 1) {
      return NextResponse.json(
        { error: 'Copies and pages must be at least 1' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      );
    }

    let user;
    let isNewUserCreated = false;

    if (isNewUser) {
      // Create new user with token
      const newTokenId = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      user = await prisma.user.create({
        data: {
          phone,
          tokenId: newTokenId,
          isVerified: false
        }
      });
      isNewUserCreated = true;
    } else {
      // Find existing user by token
      user = await prisma.user.findUnique({
        where: { tokenId }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid Token ID' },
          { status: 404 }
        );
      }
    }

    // Calculate total amount
    const totalAmount = pages * copies * PRICE_PER_PAGE;

    // Create the order
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
    console.error('Order creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
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
    const page = parseInt(searchParams.get('page') || '1');
    const q = searchParams.get('q') || '';

    if (!phone || !tokenId) {
      return NextResponse.json(
        { error: 'Phone and tokenId are required' },
        { status: 400 }
      );
    }

    // Find user by phone and tokenId
    const user = await prisma.user.findFirst({
      where: {
        phone,
        tokenId,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or invalid credentials' },
        { status: 404 }
      );
    }

    // Build where clause for orders
    const whereClause: any = {
      userId: user.id
    };

    // Add search filter if provided
    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Pagination
    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Get orders with pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: ITEMS_PER_PAGE
      }),
      prisma.order.count({ where: whereClause })
    ]);

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
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
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
    const { status, paymentStatus } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!status && !paymentStatus) {
      return NextResponse.json(
        { error: 'Status or paymentStatus is required' },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['PENDING', 'RECEIVED', 'COMPLETED', 'CANCELLED'];
    const validPaymentStatuses = ['PENDING', 'PAID', 'VERIFIED'];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Invalid paymentStatus value' },
        { status: 400 }
      );
    }

    // Update order
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
