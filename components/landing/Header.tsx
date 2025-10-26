"use client";

import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Image className="rounded-lg" src="/landing-assets/logo.png" alt="Hisaab360" width={170} height={100} />
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="hover:text-foreground transition-smooth">Features</a>
            <a href="#industries" className="hover:text-foreground transition-smooth">Industries</a>
            <a href="#whychooseus" className="hover:text-foreground transition-smooth">Why Choose Us</a>
            
            <a href="#faq" className="hover:text-foreground transition-smooth">FAQ</a>
            <a href="#contact" className="hover:text-foreground transition-smooth">Contact Us</a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
      
            {/*<Button variant="ghost" size="sm" className="rounded-full">Sign In</Button>*/}
            <a href="https://app.hisaab360.com/" target="_blank" className="bg-primary hover:bg-primary/90 transition-smooth rounded-full text-white px-3 py-2 ">
              Login
            </a>
          </div>

          <button
            className="md:hidden flex flex-col items-center justify-center w-8 h-8 space-y-1.5"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span className={`block w-6 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border">
            <nav className="flex flex-col space-y-4 p-4">
              <a href="#features" className="hover:text-foreground transition-smooth py-2">Features</a>
              <a href="#industries" className="hover:text-foreground transition-smooth py-2">Industries</a>
              <a href="#pricing" className="hover:text-foreground transition-smooth py-2">Pricing</a>
              <div className="flex flex-col space-y-3 pt-4 border-t border-border">
                <a href="https://app.hisaab360.com/" target="_blank" className="rounded-full">Sign In</a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}