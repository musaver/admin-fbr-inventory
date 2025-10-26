import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const steps = [
  {
    number: "01",
    title: "Sign Up & Setup",
    description: "Create your account and import existing inventory data in minutes with our guided setup wizard."
  },
  {
    number: "02", 
    title: "Configure Your System",
    description: "Customize categories, set up locations, and configure your business rules and preferences."
  },
  {
    number: "03",
    title: "Import Your Data",
    description: "Upload your existing inventory, customer, and supplier data using our CSV import tools."
  },
  {
    number: "04",
    title: "Start Managing",
    description: "Begin tracking inventory, creating invoices, and managing orders with full system functionality."
  }
];

export function HowItWorksSection() {
  return (
    <Section className="dark bg-gradient-subtle text-white">
      <div className="text-center space-y-4 mb-16">
        <Badge variant="secondary" className="rounded-full px-4 py-2 bg-white/10 text-white border-white/20">
          Getting Started
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-white">
          How It Works
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          Get up and running in less than 30 minutes with our streamlined onboarding process
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 rounded-3xl bg-white/10 backdrop-blur-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-white text-muted rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  <p className="text-white/80 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="relative">
          <Image 
            src="/landing-assets/analytics-dashboard.jpg" 
            alt="Analytics dashboard interface" 
            width={600}
            height={400}
            className="w-full h-auto rounded-3xl shadow-strong"
          />
          <div className="absolute inset-0 bg-black/20 rounded-3xl"></div>
        </div>
      </div>
    </Section>
  );
}