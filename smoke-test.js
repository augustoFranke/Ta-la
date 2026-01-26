require('dotenv').config();

async function testSupabase() {
  console.log('Testing Supabase...');
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase: OK');
  } catch (e) { console.log('❌ Supabase:', e.message); }
}

async function testGooglePlaces() {
  console.log('Testing Google Places API...');
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-22.2236,-54.8125&radius=5000&type=bar&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; smoke-test/1.0)'
      }
    });
    const data = await res.json();
    if (data.status === 'OK') console.log('✅ Google Places: OK');
    else console.log('❌ Google Places:', data.status);
  } catch (e) { console.log('❌ Google Places:', e.message); }
}

async function testRedis() {
  console.log('Testing Upstash Redis...');
  const { Redis } = require('@upstash/redis');
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL, token: process.env.UPSTASH_REDIS_TOKEN });
  try {
    await redis.set('test', 'value');
    const value = await redis.get('test');
    if (value === 'value') console.log('✅ Redis: OK');
    else console.log('❌ Redis: unexpected value');
  } catch (e) { console.log('❌ Redis:', e.message); }
}

async function testPostHog() {
  console.log('Testing PostHog...');
  const { PostHog } = require('posthog-node');
  const client = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY, { host: 'https://app.posthog.com' });
  try {
    client.capture({ distinctId: 'test-user', event: 'smoke_test', properties: { test: true } });
    await client.shutdown();
    console.log('✅ PostHog: OK');
  } catch (e) { console.log('❌ PostHog:', e.message); }
}

async function runTests() {
  console.log('🚀 Starting smoke tests...\n');
  await testSupabase();
  await testGooglePlaces();
  await testRedis();
  await testPostHog();
  console.log('\n🏁 Smoke tests completed.');
}

runTests();