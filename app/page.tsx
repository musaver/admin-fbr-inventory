'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { isSubdomainRequest } from '@/lib/subdomain-utils';
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { IndustriesSection } from "@/components/landing/IndustriesSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsAndIntegrationsSection } from "@/components/landing/StatsAndIntegrationsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubdomain, setIsSubdomain] = useState<boolean | null>(null);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    // Check if this is a subdomain request (using shared utility)
    const hostname = window.location.hostname;
    const hasSubdomain = isSubdomainRequest(hostname);
    
    setIsSubdomain(hasSubdomain);
    
    // Handle routing logic
    if (hasSubdomain) {
      // This is a subdomain (tenant) - handle login/dashboard redirect
      if (status === 'loading') return; // Still loading session

      if (session) {
        // User is logged in, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // User is not logged in, redirect to login
        router.replace('/login');
      }
    } else {
      // This is the main domain - always show landing page
      setShowLanding(true);
    }
  }, [session, status, router]);

  // If we haven't determined subdomain status yet, show loading
  if (isSubdomain === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If this is a subdomain (tenant), show loading while redirecting
  if (isSubdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // This is the main domain - show landing page
  if (showLanding) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <FeaturesSection />
        <BenefitsSection />
        <IndustriesSection />
        <ServicesSection />
        <HowItWorksSection />
        <FaqSection />
        <ContactSection />
        <CtaSection />
        <Footer />
      </div>
    );
  }

  // Still determining what to show
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
