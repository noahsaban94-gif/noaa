/**
 * URL Utilities for SabanOS
 * Supports Vercel Production Deployment, GitHub Repository,
 * and Active Host Links for Customer Tracking Magic Links.
 */

// Production Vercel Deployment URL requested by user
export const VERCEL_APP_URL = 'https://noaa-three.vercel.app';

// Official GitHub repository for SabanOS / Noaa
export const GITHUB_REPO_URL = 'https://github.com/noahsaban94-gif/noaa';

// Public shared URL fallback from AI Studio deployment metadata
export const SHARED_APP_FALLBACK = 'https://ais-pre-axpqikleu5feaofo2t6icc-812919982163.europe-west2.run.app';

/**
 * Returns the public, externally-accessible origin for customer and driver links.
 */
export function getPublicAppOrigin(): string {
  if (typeof window === 'undefined') {
    return VERCEL_APP_URL;
  }

  // Use the active window origin if running on custom domain or Vercel
  const origin = window.location.origin;
  if (origin && origin !== 'null' && !origin.includes('localhost') && !origin.includes('ais-dev-')) {
    return origin;
  }

  return VERCEL_APP_URL;
}

/**
 * Returns the Vercel Magic Link for customer tracking.
 * Example: https://noaa-three.vercel.app/?track=6215410
 */
export function getVercelTrackingUrl(orderNumber: string): string {
  const cleanNum = encodeURIComponent(orderNumber || '6215410');
  return `${VERCEL_APP_URL}/?track=${cleanNum}`;
}

/**
 * Returns a complete, publicly accessible magic link to the customer tracking page.
 * Uses Vercel production by default to ensure 100% public availability.
 */
export function getPublicTrackingUrl(orderNumber: string, forceCurrentHost = false): string {
  if (forceCurrentHost) {
    const base = typeof window !== 'undefined' && window.location.origin ? window.location.origin : VERCEL_APP_URL;
    return `${base}/?track=${encodeURIComponent(orderNumber || '6215410')}`;
  }
  return getVercelTrackingUrl(orderNumber);
}

/**
 * Returns a complete, publicly accessible link to the driver multi-stop route.
 */
export function getPublicRouteUrl(routeCode: string): string {
  const base = getPublicAppOrigin();
  const cleanCode = encodeURIComponent(routeCode);
  return `${base}/?route=${cleanCode}`;
}
