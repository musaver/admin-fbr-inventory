import Link from 'next/link';

export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Workspace Not Found</h2>
        <p className="text-muted-foreground">
          We couldn&apos;t find a workspace at this address. The subdomain may be
          misspelled, or the account may no longer exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition"
          >
            Go to Homepage
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2 border border-primary text-primary rounded-full hover:bg-primary/10 transition"
          >
            Create an Account
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Need help? Contact{' '}
          <a href="mailto:support@hisaab360invoicing.com" className="underline">
            support@hisaab360invoicing.com
          </a>
        </p>
      </div>
    </div>
  );
}
