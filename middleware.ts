import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const referer = request.headers.get("referer");
  console.log("[middleware]referer", referer);

  // Check if the request is coming from chef.se, localhost, or availsthlm.se
  const allowedReferers = ["chef.se", "localhost", "availsthlm.se"];
  const isAllowed = allowedReferers.some((domain) => referer?.includes(domain));

  if (!isAllowed) {
    return new NextResponse("Access denied", { status: 403 });
  }

  const response = NextResponse.next();

  // Add Content-Security-Policy header to only allow embedding from specified domains
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors https://chef.se https://ewymsu.availsthlm.se http://localhost"
  );

  return response;
}

// Make the matcher more specific to your needs
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
