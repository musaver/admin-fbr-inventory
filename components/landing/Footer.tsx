import Image from "next/image";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 max-w-7xl py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
            <Image className="rounded-lg" src="/landing-assets/logo.png" alt="Hisaab360" width={150} height={100} />
         
            </div>
            <p className="text-background/70 leading-relaxed">
              Streamline your inventory management with our comprehensive solution designed for modern businesses.
            </p>
            {/*<div className="flex space-x-4">
              <div className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-smooth cursor-pointer">
                <Facebook className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-smooth cursor-pointer">
                <Twitter className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-smooth cursor-pointer">
                <Linkedin className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-smooth cursor-pointer">
                <Instagram className="w-5 h-5" />
              </div>
            </div>*/}
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="#features" className="text-background/70 hover:text-background transition-smooth">Features</a></li>
              <li><a href="#industries" className="text-background/70 hover:text-background transition-smooth">Industries</a></li>
              <li><a href="#whychooseus" className="text-background/70 hover:text-background transition-smooth">Why Choose Us</a></li>
              
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Support</h3>
            <ul className="space-y-3">
            <li><a href="#faq" className="text-background/70 hover:text-background transition-smooth">FAQ</a></li>
            <li><a href="#contact" className="text-background/70 hover:text-background transition-smooth">Contact Us</a></li>
            <li><a href="mailto:support@hisaab360.com" className="flex items-center space-x-2 text-background/70 hover:text-background transition-smooth"><Mail className="w-5 h-5 text-background/70" />
            <span className="text-background/70">support@hisaab360.com</span></a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-background/70" />
                <span className="text-background/70">+92 335 5836 228</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-background/70 mt-1" />
                <span className="text-background/70">
                Alrasheed arcade second floor <br/> 
                Flat no 1 mujahid street , <br/>
                Defence road , Rawalpindi
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center">
          <p className="text-background/70">
            © 2025 Hisaab360. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}