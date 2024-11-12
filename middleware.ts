import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const referer = request.headers.get("referer");
  console.log("referer", referer);
  const response = NextResponse.next();

  // Define allowed hostnames
  const allowedHostnames = [
    "localhost:3000",
    "127.0.0.1:5500",
    "ewymsu.availsthlm.se",
    "chef.se",
  ]; // Add more domains as needed

  // Set Content-Security-Policy header
  response.headers.set(
    "Content-Security-Policy",
    // This CSP directive controls which parent pages can embed this page in an iframe
    // 'self' allows the same origin, and localhost:3000 is explicitly allowed
    `frame-ancestors 'self' ${allowedHostnames.map((hostname) => `http://${hostname} https://${hostname}`).join(" ")}`
  );

  // Set X-Frame-Options for older browsers
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Check if the request is coming from an allowed domain
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (!allowedHostnames.includes(refererUrl.hostname)) {
        return new NextResponse(null, { status: 403 });
      }
    } catch (error) {
      return new NextResponse(null, { status: 403 });
    }
  }

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
