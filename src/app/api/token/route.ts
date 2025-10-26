/**
 * @file src/app/api/token/route.ts
 * @description Token management API for issuing and rotating user tokens
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  createErrorResponse, 
  ErrorCode, 
  parseRequestBody, 
  validatePhone,
  handlePrismaError 
} from '@/lib/errorHandler';

/**
 * Issues or rotates a token for a phone number
 * @param request - NextRequest with phone number
 * @returns NextResponse with token information
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.error!;
    }

    const { phone } = parseResult.data!;

    // Validate phone number
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return createErrorResponse(
        phoneValidation.error!,
        ErrorCode.PHONE_INVALID,
        400,
        { field: 'phone' }
      );
    }

    // Check if user exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { phone }
      });
    } catch (error) {
      return handlePrismaError(error);
    }

    let tokenId: string;
    let isNewUser = false;

    if (existingUser) {
      // Rotate existing token with retry logic for collision
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          tokenId = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          await prisma.user.update({
            where: { phone },
            data: { 
              tokenId,
              updatedAt: new Date()
            }
          });
          break; // Success, exit retry loop
        } catch (error) {
          attempts++;
          if (error.code === 'P2002' && attempts < maxAttempts) {
            // Unique constraint violation, retry with new token
            console.warn(`Token collision detected, retrying... (attempt ${attempts})`);
            continue;
          }
          return handlePrismaError(error);
        }
      }
      
      if (attempts >= maxAttempts) {
        return createErrorResponse(
          'Failed to generate unique token after multiple attempts',
          ErrorCode.SERVER,
          500,
          { suggestion: 'Please try again later' }
        );
      }
    } else {
      // Create new user with token
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          tokenId = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          isNewUser = true;
          
          await prisma.user.create({
            data: {
              phone,
              tokenId,
              isVerified: false
            }
          });
          break; // Success, exit retry loop
        } catch (error) {
          attempts++;
          if (error.code === 'P2002' && attempts < maxAttempts) {
            // Unique constraint violation, retry with new token
            console.warn(`Token collision detected, retrying... (attempt ${attempts})`);
            continue;
          }
          return handlePrismaError(error);
        }
      }
      
      if (attempts >= maxAttempts) {
        return createErrorResponse(
          'Failed to generate unique token after multiple attempts',
          ErrorCode.SERVER,
          500,
          { suggestion: 'Please try again later' }
        );
      }
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
    return createErrorResponse(
      'Failed to create/rotate token',
      ErrorCode.SERVER,
      500,
      { suggestion: 'Please try again later' }
    );
  }
}
