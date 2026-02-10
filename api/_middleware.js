export default function middleware(req, res) {
  // Permitir que la app se cargue en iframes de Procore
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Content Security Policy para permitir Procore
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.procore.com https://procore.com"
  );
  
  return res;
}
