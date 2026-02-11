import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getUserProfile, getDashboardPath } from "@/lib/auth/helpers";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // If auth code or token_hash arrives at a non-callback URL, forward to /auth/callback
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if ((code || tokenHash) && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // API routes handle their own authentication - don't redirect
  const isApiRoute = pathname.startsWith("/api/");
  if (isApiRoute) {
    return supabaseResponse;
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/auth/callback", "/auth/set-password"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isSetPasswordPage = pathname === "/auth/set-password";

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // For authenticated users, enforce role-based routing
  if (user) {
    // Allow set-password page before any role-based redirects
    // so new users (admin or client) can set their password after invite/recovery
    if (isSetPasswordPage) {
      return supabaseResponse;
    }

    const profile = await getUserProfile(supabase, user.id);
    const isAdmin = profile?.role === "admin";
    const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
    const isLoginPage = pathname === "/login" || pathname === "/admin/login";

    // Redirect based on role
    if (isAdmin && !isAdminRoute) {
      // Admin trying to access client routes - redirect to admin dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }

    if (!isAdmin && isAdminRoute) {
      // Non-admin trying to access admin routes - redirect to client dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (isLoginPage) {
      // Authenticated user on login page - redirect to their dashboard
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPath(profile?.role);
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
