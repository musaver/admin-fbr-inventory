import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Store, 
  Shirt, 
  ShoppingBag, 
  Laptop, 
  BookOpen, 
  ChefHat, 
  Truck, 
  Monitor 
} from "lucide-react";

const industries = [
  { icon: Store, title: "Retail Stores", description: "Complete POS and inventory solutions" },
  { icon: Shirt, title: "Garments & Fashion", description: "Size, color, and style variant tracking" },
  { icon: ShoppingBag, title: "Shoe Stores", description: "Multi-size inventory management" },
  { icon: Laptop, title: "Electronics & Appliances", description: "Serial number and warranty tracking" },
  { icon: BookOpen, title: "Book Stores", description: "ISBN tracking and author management" },
  { icon: ChefHat, title: "Restaurants & Bakers", description: "Ingredient and recipe management" },
  { icon: Truck, title: "Distribution & Wholesale", description: "Bulk orders and supplier management" },
  { icon: Monitor, title: "Computer Accessories", description: "Tech product specifications tracking" }
];

export function IndustriesSection() {
  return (
    <Section id="industries">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground">
          Industries We Serve
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Tailored solutions for businesses across various industries
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {industries.map((industry, index) => (
          <Card key={index} className="border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-medium group rounded-3xl">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto group-hover:bg-primary transition-smooth">
                <industry.icon className="w-6 h-6 text-accent-foreground group-hover:text-primary-foreground transition-smooth" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{industry.title}</h3>
              <p className="text-sm text-muted-foreground">{industry.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}