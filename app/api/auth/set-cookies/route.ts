import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken, expiresIn = 86400 } = body;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Missing tokens' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + expiresIn * 1000);

    // Set cookies with proper flags
    response.cookies.set('auth_token', accessToken, {
      expires: expiryDate,
      path: '/',
      httpOnly: false, // Must be false so client can read it
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set('refresh_token', refreshToken, {
      expires: expiryDate,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    console.log('[SET_COOKIES] Cookies set successfully', {
      authTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
      expiryDate: expiryDate.toISOString(),
    });

    return response;
  } catch (error) {
    console.error('[SET_COOKIES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set cookies' },
      { status: 500 }
    );
  }
}