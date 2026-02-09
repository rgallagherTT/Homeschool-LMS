import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicRoutes = ["/login", "/register", "/"];
const parentRoutes = [
  "/dashboard",
  "/calendar",
  "/courses",
  "/assignments",
  "/gradebook",
  "/reports",
  "/students",
  "/settings",
  "/onboarding",
];
const studentRoutePrefix = "/student";

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return response;
  }

  // Check if user is authenticated
  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role;

  // Protect parent routes
  const isParentRoute = parentRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  if (isParentRoute && userRole !== "parent") {
    if (userRole === "student") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect student routes
  if (pathname.startsWith(studentRoutePrefix)) {
    if (userRole !== "student") {
      if (userRole === "parent") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
