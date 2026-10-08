import Link from 'next/link';

export default function TenantSuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-6xl font-bold text-amber-500">⏸</h1>
        <h2 className="text-2xl font-semibold">Account Suspended</h2>
        <p className="text-muted-foreground">
          This workspace is currently suspended. If you believe this is a
          mistake, or you&apos;d like to reactivate your account, please get in
          touch with our support team.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@hisaab360invoicing.com"
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition"
          >
            Contact Support
          </a>
          <Link
            href="/"
            className="px-6 py-2 border border-primary text-primary rounded-full hover:bg-primary/10 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
