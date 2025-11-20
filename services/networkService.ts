import { CheckResult, ConnectivityStatus } from '../types';

const TIMEOUT_MS = 5000;

/**
 * Helper function to perform a single fetch request
 */
const fetchUrl = async (url: string, method: string = 'GET', timeout: number = TIMEOUT_MS): Promise<number> => {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    await fetch(url, {
      method,
      mode: 'no-cors',
      // Use 'reload' to force network request without appending suspicious query params like ?_t=...
      cache: 'reload', 
      // Stealth options to reduce WAF blocking (403s)
      credentials: 'omit', 
      referrerPolicy: 'no-referrer',
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
 * 2. If fails, Try GET request to root URL (Fallback). 
 *    Note: We use GET instead of HEAD for fallback because many WAFs (like StackOverflow's) 
 *    block HEAD requests to root, but allow GET.
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
      // Attempt 2: Root URL Check (GET)
      // Using GET increases success rate against WAFs compared to HEAD
      const latency = await fetchUrl(url, 'GET', TIMEOUT_MS);
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