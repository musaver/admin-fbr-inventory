import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calculator, Package, BarChart3 } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Invoicing",
    description: "Create and send professional invoices with automated calculations and payment tracking."
  },
  {
    icon: Calculator,
    title: "Accounting",
    description: "Comprehensive financial management with real-time reporting and expense tracking."
  },
  {
    icon: Package,
    title: "Inventory Tracking",
    description: "Real-time stock monitoring with automated alerts for low inventory levels."
  },
  {
    icon: BarChart3,
    title: "Reporting & Analytics",
    description: "Detailed insights and analytics to make data-driven business decisions."
  }
];

export function FeaturesSection() {
  return (
    <Section id="features" className="bg-muted/30">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-5xl font-title font-bold text-foreground tracking-tight">
          Core Features
        </h2>
        <p className="text-xl font-body text-muted-foreground max-w-2xl mx-auto font-medium">
          Everything you need to manage your inventory efficiently and grow your business
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 rounded-3xl">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-space font-semibold text-foreground">{feature.title}</h3>
              <p className="font-body text-muted-foreground leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}