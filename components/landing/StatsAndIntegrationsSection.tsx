import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    number: "10,000+",
    label: "Businesses Trust Us",
    description: "From startups to enterprises"
  },
  {
    number: "99.9%",
    label: "Uptime Guarantee",
    description: "Reliable 24/7 availability"
  },
  {
    number: "40%",
    label: "Average Cost Reduction",
    description: "In inventory management expenses"
  },
  {
    number: "30 mins",
    label: "Quick Setup",
    description: "Get started in under 30 minutes"
  }
];

const integrations = [
  "QuickBooks", "Xero", "Shopify", "WooCommerce", "Amazon", "eBay",
  "Square POS", "Stripe", "PayPal", "Salesforce", "HubSpot", "Slack"
];

export function StatsAndIntegrationsSection() {
  return (
    <Section className="bg-muted/30">
      <div className="space-y-20">
        {/* Stats Section */}
        <div className="text-center space-y-16">
          <div className="space-y-4">
            <Badge variant="secondary" className="rounded-full px-4 py-2">
              Trusted by Thousands
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Numbers That Speak
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-soft rounded-3xl">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="text-4xl font-bold text-foreground">{stat.number}</div>
                  <div className="text-lg font-semibold text-foreground">{stat.label}</div>
                  <div className="text-muted-foreground">{stat.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Integrations Section */}
        <div className="text-center space-y-12">
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Seamless Integrations
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect with your favorite tools and platforms to create a unified business ecosystem
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {integrations.map((integration, index) => (
              <div 
                key={index} 
                className="p-4 bg-card rounded-2xl border border-border hover:border-primary/50 transition-smooth text-center"
              >
                <span className="text-foreground font-medium">{integration}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}