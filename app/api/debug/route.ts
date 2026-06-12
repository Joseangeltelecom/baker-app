import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, initializeDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const info: Record<string, any> = {};

  // 1. Env vars (sin mostrar valores completos)
  info.AUTH_SECRET_set = !!process.env.AUTH_SECRET;
  info.AUTH_SECRET_len = process.env.AUTH_SECRET?.length ?? 0;
  info.AUTH_URL = process.env.AUTH_URL;
  info.LIBSQL_DB_URL_set = !!process.env.LIBSQL_DB_URL;
  info.LIBSQL_DB_AUTH_TOKEN_set = !!process.env.LIBSQL_DB_AUTH_TOKEN;

  // 2. Headers de la request
  info.cookie_header = request.headers.get('cookie')?.slice(0, 200) ?? '(none)';
  info.x_forwarded_proto = request.headers.get('x-forwarded-proto');
  info.host = request.headers.get('host');

  // 3. Cookie names disponibles en la request
  const allCookies = request.headers.get('cookie') ?? '';
  info.cookie_names = allCookies.split(';').map(c => c.split('=')[0]?.trim()).filter(Boolean);

  // 4. Intentar getToken con secure=false
  try {
    const tokenHttp = await getToken({
      req: request as any,
      secret: process.env.AUTH_SECRET,
      secureCookie: false,
    });
    info.token_insecure = tokenHttp ? { id: (tokenHttp as any).id, name: (tokenHttp as any).name } : null;
  } catch (e: any) {
    info.token_insecure_error = e.message;
  }

  // 5. Intentar getToken con secure=true
  try {
    const tokenHttps = await getToken({
      req: request as any,
      secret: process.env.AUTH_SECRET,
      secureCookie: true,
    });
    info.token_secure = tokenHttps ? { id: (tokenHttps as any).id, name: (tokenHttps as any).name } : null;
  } catch (e: any) {
    info.token_secure_error = e.message;
  }

  // 6. DB connection
  try {
    await initializeDB();
    info.db_ok = true;
  } catch (e: any) {
    info.db_error = e.message;
  }

  return NextResponse.json(info);
}
