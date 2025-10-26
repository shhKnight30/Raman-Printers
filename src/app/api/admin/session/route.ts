/**
 * @file src/app/api/admin/session/route.ts
 * @description Admin session management with passcode authentication
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  createErrorResponse, 
  ErrorCode, 
  parseRequestBody 
} from '@/lib/errorHandler';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';
const SESSION_COOKIE_NAME = 'admin-session';

/**
 * Handles admin login with passcode
 * @param request - NextRequest with passcode
 * @returns NextResponse with login result
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.error!;
    }

    const { passcode } = parseResult.data!;

    // Validate passcode
    if (!passcode || typeof passcode !== 'string') {
      return createErrorResponse(
        'Passcode is required',
        ErrorCode.MISSING_FIELDS,
        400,
        { field: 'passcode' }
      );
    }

    if (passcode.trim() !== ADMIN_PASSCODE) {
      return createErrorResponse(
        'Invalid passcode',
        ErrorCode.AUTH,
        401,
        { suggestion: 'Please check your passcode and try again' }
      );
    }

    // Set HTTP-only cookie with error handling
    try {
      const cookieStore = cookies();
      cookieStore.set(SESSION_COOKIE_NAME, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      });
    } catch (cookieError) {
      console.error('Failed to set session cookie:', cookieError);
      return createErrorResponse(
        'Failed to create session',
        ErrorCode.SERVER,
        500,
        { suggestion: 'Please try again later' }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return createErrorResponse(
      'Login failed',
      ErrorCode.SERVER,
      500,
      { suggestion: 'Please try again later' }
    );
  }
}

/**
 * Handles admin logout
 * @returns NextResponse with logout result
 */
export async function DELETE() {
  try {
    const cookieStore = cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
