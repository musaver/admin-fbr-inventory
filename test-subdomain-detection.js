// Test subdomain detection logic
function testSubdomainDetection(hostname) {
  const parts = hostname.split('.');
  
  // For localhost development, check for subdomain.localhost format
  if (hostname.includes('localhost')) {
    const hasSubdomain = parts.length >= 2 && parts[0] !== 'localhost';
    return hasSubdomain;
  } else {
    // For production, check for subdomain.domain.tld format
    const hasSubdomain = parts.length > 2 && !hostname.startsWith('www.');
    return hasSubdomain;
  }
}

const testCases = [
  'localhost:3000',
  'acme-electronics.localhost:3000',
  'beta-retail.localhost:3000', 
  'yourdomain.com',
  'acme-electronics.yourdomain.com',
  'www.yourdomain.com',
  'api.yourdomain.com'
];

console.log('🧪 Testing subdomain detection logic...\n');

testCases.forEach(hostname => {
  const isSubdomain = testSubdomainDetection(hostname);
  const shouldShowSidebar = isSubdomain ? '✅ Show Sidebar' : '❌ No Sidebar (Landing Page)';
  console.log(`${hostname.padEnd(35)} → ${shouldShowSidebar}`);
});

console.log('\n📋 Expected Results:');
console.log('- localhost:3000 should NOT show sidebar (landing page)');
console.log('- acme-electronics.localhost:3000 should show sidebar (admin panel)');
console.log('- beta-retail.localhost:3000 should show sidebar (admin panel)');
