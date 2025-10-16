/**
 * @file src/app/api/token/route.ts
 * @description Token management API for issuing and rotating user tokens
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Issues or rotates a token for a phone number
 * @param request - NextRequest with phone number
 * @returns NextResponse with token information
 */
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Valid 10-digit phone number is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    let tokenId: string;
    let isNewUser = false;

    if (existingUser) {
      // Rotate existing token
      tokenId = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.user.update({
        where: { phone },
        data: { 
          tokenId,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new user with token
      tokenId = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      isNewUser = true;
      
      await prisma.user.create({
        data: {
          phone,
          tokenId,
          isVerified: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      tokenId,
      isNewUser,
      message: isNewUser 
        ? 'New user created with token' 
        : 'Token rotated successfully'
    });

  } catch (error) {
    console.error('Token creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create/rotate token' },
      { status: 500 }
    );
  }
}
