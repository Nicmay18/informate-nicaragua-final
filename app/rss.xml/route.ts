export async function GET() {
  return new Response(null, {
    status: 301,
    headers: {
      Location: '/feed.xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
