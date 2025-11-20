import { CheckResult, ConnectivityStatus } from '../types';

const TIMEOUT_MS = 5000;

/**
 * Helper function to perform a single fetch request
 */
const fetchUrl = async (url: string, method: string = 'HEAD', timeout: number = TIMEOUT_MS): Promise<number> => {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Add timestamp to bypass cache
  const cacheBuster = url.includes('?') ? `&_t=${Date.now()}` : `?_t=${Date.now()}`;
  const targetUrl = `${url}${cacheBuster}`;

  try {
    await fetch(targetUrl, {
      method,
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const end = performance.now();
    return Math.round(end - start);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Checks connectivity to a site.
 * Strategy (Updated):
 * 1. Try GET request to /favicon.ico (Preferred: lighter, often whitelisted).
 * 2. If fails, Try HEAD request to root URL (Fallback).
 */
export const checkConnectivity = async (siteId: string, url: string): Promise<CheckResult> => {
  // Construct Favicon URL
  let faviconUrl = '';
  try {
    const urlObj = new URL(url);
    faviconUrl = `${urlObj.origin}/favicon.ico`;
  } catch (e) {
    // Fallback if URL parsing fails
    faviconUrl = url; 
  }

  try {
    // Attempt 1: Favicon Check (GET)
    // We use GET for favicon as it's a static resource. 
    // We use a slightly shorter timeout (4s) for the primary attempt to keep UI responsive if fallback is needed.
    const latency = await fetchUrl(faviconUrl, 'GET', 4000);
    return {
      siteId,
      status: ConnectivityStatus.SUCCESS,
      latency,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    // If attempt 1 (Favicon) fails, try Attempt 2 (Root URL)
    
    try {
      // Attempt 2: Root URL Check (HEAD)
      const latency = await fetchUrl(url, 'HEAD', TIMEOUT_MS);
      return {
        siteId,
        status: ConnectivityStatus.SUCCESS,
        latency,
        timestamp: Date.now(),
      };
    } catch (fallbackError: any) {
      let status = ConnectivityStatus.ERROR;
      
      // Check if either error was a timeout
      if (error.name === 'AbortError' || fallbackError.name === 'AbortError') {
        status = ConnectivityStatus.TIMEOUT;
      }

      return {
        siteId,
        status,
        latency: 0,
        timestamp: Date.now(),
      };
    }
  }
};