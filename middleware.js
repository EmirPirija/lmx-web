import { NextResponse } from 'next/server'

const MAINTENANCE_PUBLIC_PATHS = new Set([
  '/privacy-policy',
  '/terms-and-condition',
  '/data-deletion',
]);

export function middleware(req) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const normalizedPath =
    req.nextUrl.pathname === '/'
      ? '/'
      : req.nextUrl.pathname.replace(/\/+$/, '');
  
  // 1. Check for the secret "backdoor" in URL OR in Cookies
  const hasSecretKey = req.nextUrl.searchParams.get('view') === 'dev';
  const hasCookie = req.cookies.has('dev_access');
  const isPublicMaintenancePath = MAINTENANCE_PUBLIC_PATHS.has(normalizedPath);

  // 2. Logic: If maintenance is ON and user isn't a dev, show the page
  if (isMaintenanceMode && !hasSecretKey && !hasCookie && !isPublicMaintenancePath) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            body { 
              background: black; 
              color: #fff; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              font-family: sans-serif; 
              margin: 0; 
              overflow: hidden;
            }
            .content { 
              text-align: center; 
              animation: fadeIn 1.2s ease-out forwards; 
            }
            img { margin-bottom: 20px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.1)); }
            h1 { letter-spacing: 8px; font-weight: 300; margin: 0; }
            p { color: white; font-size: 20px; margin-top: 10px; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="content">
            <img src="https://poslovi.lmx.ba/wp-content/uploads/2025/11/imgi_1_6888a4cb9bc945.718931351753785547-4.png" alt="lmx.ba" width="512">
            <p>Nešto domaće.</p>
            <p>Nešto drugačije.</p>
            <p>Nešto naše.</p>
            <p>Uskoro s vama.</p>
          </div>
        </body>
      </html>`,
      {
        status: 503,
        headers: { 'content-type': 'text/html' }
      }
    );
  }

  // 3. If they used the secret key, set the cookie so they can navigate the whole site
  const response = NextResponse.next();
  if (hasSecretKey && !hasCookie) {
    response.cookies.set('dev_access', 'true', { 
      path: '/', 
      maxAge: 60 * 60 * 24 // Valid for 24 hours
    });
  }

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
