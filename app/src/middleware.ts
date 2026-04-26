import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicRoutes = ['/', '/about', '/departments', '/projects', '/auth/login', '/auth/register'];
const citizenRoutes = ['/citizen'];
const officialRoutes = ['/official'];
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  const isPublicRoute = publicRoutes.some(r => pathname === r || pathname.startsWith('/projects/'));
  if (isPublicRoute) return supabaseResponse;

  // Require auth for protected routes
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Get user role for route protection
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const role = profile?.role;

  if (adminRoutes.some(r => pathname.startsWith(r)) && role !== 'Admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (officialRoutes.some(r => pathname.startsWith(r)) && !['Official', 'Admin'].includes(role || '')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (citizenRoutes.some(r => pathname.startsWith(r)) && role !== 'Citizen' && role !== 'Admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
