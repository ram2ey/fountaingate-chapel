export const dynamic = 'force-dynamic';

// Process liveness only. Does not claim database or unfinished feature readiness.
export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
