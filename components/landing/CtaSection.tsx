import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <Section className="bg-gradient-hero hidden">
      <Card className="border-0 shadow-strong rounded-3xl bg-card/95 backdrop-blur">
        <CardContent className="p-16 text-center space-y-8">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Ready to Transform Your Inventory Management?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join thousands of businesses already using Hisaab360 to streamline operations, 
              reduce costs, and boost efficiency.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 transition-smooth rounded-full px-8">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8">
              Watch Demo Video
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-muted-foreground text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Cancel anytime</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}