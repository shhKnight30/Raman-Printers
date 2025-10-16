/**
 * @file src/app/api/admin/session/route.ts
 * @description Admin session management with passcode authentication
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';
const SESSION_COOKIE_NAME = 'admin-session';

/**
 * Handles admin login with passcode
 * @param request - NextRequest with passcode
 * @returns NextResponse with login result
 */
export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json();

    if (!passcode) {
      return NextResponse.json(
        { error: 'Passcode is required' },
        { status: 400 }
      );
    }

    if (passcode !== ADMIN_PASSCODE) {
      return NextResponse.json(
        { error: 'Invalid passcode' },
        { status: 401 }
      );
    }

    // Set HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
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
