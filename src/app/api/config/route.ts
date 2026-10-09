import { publicDemoOnly } from '@/server/demo-policy';

export async function GET() {
  return Response.json({ live: !publicDemoOnly() && Boolean(process.env.OPENAI_API_KEY), persistence: !publicDemoOnly() && Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) }, { headers: { 'Cache-Control': 'no-store' } });
}
