import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for small businesses",
    features: [
      "Up to 1,000 products",
      "Basic invoicing",
      "Inventory tracking",
      "Email support",
      "1 user account"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "$79",
    period: "/month",
    description: "For growing businesses",
    features: [
      "Up to 10,000 products",
      "Advanced invoicing & accounting",
      "Multi-location inventory",
      "Reporting & analytics",
      "Up to 5 user accounts",
      "POS integration",
      "Priority support"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "For large-scale operations",
    features: [
      "Unlimited products",
      "Advanced accounting features",
      "Multi-warehouse management",
      "Custom reporting",
      "Unlimited user accounts",
      "API access",
      "24/7 dedicated support",
      "Custom integrations"
    ],
    popular: false
  }
];

export function PricingSection() {
  return (
    <Section id="pricing" className="bg-muted/30">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your business needs. All plans include a 14-day free trial.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            className={`relative border-2 transition-all duration-300 hover:shadow-medium rounded-3xl ${
              plan.popular 
                ? 'border-primary shadow-glow scale-105' 
                : 'border-border hover:border-primary/30'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
              <div className="space-y-2">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full rounded-full ${
                  plan.popular 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                    : 'bg-accent hover:bg-accent/80 text-accent-foreground'
                } transition-smooth`}
                size="lg"
              >
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}