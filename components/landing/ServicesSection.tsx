import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  ShoppingCart, 
  Truck, 
  RefreshCw, 
  CreditCard 
} from "lucide-react";

const services = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Overview",
    description: "Real-time business insights at a glance"
  },
  {
    icon: FileSpreadsheet,
    title: "Send Estimates & Quotations",
    description: "Professional quotes with approval tracking"
  },
  {
    icon: ShoppingCart,
    title: "Track Orders",
    description: "End-to-end order management system"
  },
  {
    icon: Truck,
    title: "Delivery Management",
    description: "Streamlined shipping and logistics"
  },
  {
    icon: RefreshCw,
    title: "Recurring Invoices",
    description: "Automated billing for subscription services"
  },
  {
    icon: CreditCard,
    title: "Point of Sales Integration",
    description: "Seamless POS system connectivity"
  }
];

export function ServicesSection() {
  return (
    <Section className="bg-gradient-subtle">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground">
          Additional Services
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Comprehensive tools to manage every aspect of your business operations
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 rounded-3xl">
            <CardContent className="p-8 space-y-4">
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                <service.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{service.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{service.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}