"use client";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { useState } from "react";
import { Play, ArrowRight, Clock, CreditCard, Sparkles, Contact } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  return (
    <Section background="gradient" className="pt-8 pb-16 text-white">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-title font-bold leading-tight tracking-tight">
              Accounting Made Easy for Pakistan{" "}
            </h1>
            <p className="text-xl font-body text-white/90 leading-relaxed max-w-lg font-medium">
              Digitally integerated with FBR, All-in-one inventory management solution designed to streamline your operations and increase efficiency.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => {
              const contactSection = document.getElementById('contact');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'instant' });
              }
            }} size="lg" className="group bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-glow rounded-full border-2 border-white/20 hover:border-white/40 font-space font-semibold">
              <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 text-white/80 hidden">
            <div className="group flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="font-body font-semibold group-hover:text-white transition-colors duration-300">14-day free trial</span>
            </div>
            <div className="group flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center animate-pulse">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="font-body font-semibold group-hover:text-white transition-colors duration-300">No credit card required</span>
            </div>
          </div>
        </div>

        <div className="relative group">
          <Image 
            src="/landing-assets/hero-inventory.png" 
            alt="Inventory Management Dashboard" 
            width={800}
            height={600}
            className="relative w-full h-auto rounded-sm shadow-strong transform group-hover:scale-[1.02] transition-transform duration-500"
          />
          
          {/* Floating elements for interactivity */}
          <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          <div className="absolute top-6 right-6 w-2 h-2 bg-green-400 rounded-full"></div>
          
          <div className="absolute bottom-4 left-4 w-3 h-3 bg-blue-400 rounded-full animate-ping animation-delay-1000"></div>
          <div className="absolute bottom-6 left-6 w-2 h-2 bg-blue-400 rounded-full"></div>
        </div>
      </div>
    </Section>
  );
}