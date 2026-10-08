import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import Image from "next/image";

const benefits = [
  "Reduce inventory costs by up to 40%",
  "Eliminate stockouts and overstock situations",
  "Automate repetitive inventory tasks",
  "Real-time visibility across all locations",
  "Integrate with existing business systems",
  "Scale from small business to enterprise",
  "24/7 automated monitoring and alerts",
  "Comprehensive audit trails and compliance"
];

export function BenefitsSection() {
  return (
    <Section id="whychooseus" className="dark bg-gradient-subtle text-white">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        
        <div className="space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="rounded-full px-4 py-2 bg-white/10 text-white border-white/20">
              Why Choose Hisaab360
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Transform Your Business Operations
            </h2>
            <p className="text-xl text-white/80 leading-relaxed">
              Join thousands of businesses that have revolutionized their inventory management 
              with our comprehensive solution.
            </p>
          </div>
          <div className="relative">
          <Image 
            src="/landing-assets/warehouse-management.jpg" 
            alt="Modern warehouse inventory management" 
            width={600}
            height={400}
            className="w-full h-auto rounded-3xl shadow-strong"
          />
          <div className="absolute inset-0 bg-black/20 rounded-3xl"></div>
        </div>
        </div>

        <div className="space-y-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-full shadow-soft">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-black" />
              </div>
              <span className="text-muted-foreground font-medium">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}