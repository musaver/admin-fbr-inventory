/**
 * Utility function to check if the current hostname is a subdomain
 * This ensures consistent subdomain detection across the application
 */
export function isSubdomainRequest(hostname: string): boolean {
  const parts = hostname.split('.');
  
  // For localhost development, check for subdomain.localhost format
  if (hostname.includes('localhost')) {
    return parts.length >= 2 && parts[0] !== 'localhost';
  } 
  
  // For production, check for subdomain.domain.tld format
  // Exclude 'www' as it's treated as the main domain
  return parts.length > 2 && !hostname.startsWith('www.');
}

/**
 * Hook to get the current subdomain status
 * Returns null while determining, then boolean
 */
export function useSubdomainDetection(): boolean | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }
  
  return isSubdomainRequest(window.location.hostname);
}
