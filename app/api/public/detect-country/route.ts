import { NextRequest, NextResponse } from 'next/server';
import { getPhoneConfig, COUNTRY_PHONE_CONFIGS } from '@/lib/phone-prefixes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/detect-country
 * Detects the user's country based on IP and returns phone config
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get country from various sources
    let countryCode = 'DEFAULT';

    // 1. Check Cloudflare header (if behind CF)
    const cfCountry = request.headers.get('cf-ipcountry');
    if (cfCountry && COUNTRY_PHONE_CONFIGS[cfCountry]) {
      countryCode = cfCountry;
    }

    // 2. Check X-Vercel-IP-Country header
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    if (vercelCountry && COUNTRY_PHONE_CONFIGS[vercelCountry]) {
      countryCode = vercelCountry;
    }

    // 3. If no header detected, try external API (fallback)
    if (countryCode === 'DEFAULT') {
      try {
        // Use ip-api.com (free, no API key required)
        const ipRes = await fetch('http://ip-api.com/json/?fields=countryCode', {
          next: { revalidate: 3600 }, // Cache for 1 hour
        });
        
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData?.countryCode && COUNTRY_PHONE_CONFIGS[ipData.countryCode]) {
            countryCode = ipData.countryCode;
          }
        }
      } catch (error) {
        // Silently fail, use default
        console.error('IP detection error:', error);
      }
    }

    const phoneConfig = getPhoneConfig(countryCode);

    return NextResponse.json({
      countryCode,
      ...phoneConfig,
    });
  } catch (error) {
    console.error('Country detection error:', error);
    // Return Argentina as default fallback
    const defaultConfig = getPhoneConfig('AR');
    return NextResponse.json({
      countryCode: 'AR',
      ...defaultConfig,
    });
  }
}
