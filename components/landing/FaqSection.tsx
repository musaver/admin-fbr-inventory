import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    question: "How quickly can I get started with Hisaab360?",
    answer: "You can set up your account and start managing inventory within 30 minutes. Our guided onboarding process helps you import existing data and configure the system to match your business needs."
  },
  {
    question: "Can I import my existing inventory data?",
    answer: "Yes! We support CSV imports from most inventory management systems, spreadsheets, and e-commerce platforms. Our import wizard guides you through the process and validates your data."
  },
  {
    question: "Do you offer mobile apps?",
    answer: "Hisaab360 is fully responsive and works perfectly on all devices. We also offer dedicated mobile apps for iOS and Android with barcode scanning and offline capabilities."
  },
  {
    question: "What kind of support do you provide?",
    answer: "We offer 24/7 email support for all plans, priority support for Professional plans, and dedicated account management for Enterprise customers. We also provide comprehensive documentation and video tutorials."
  },
  {
    question: "Can I upgrade or downgrade my plan anytime?",
    answer: "Absolutely! You can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at your next billing cycle. We'll prorate any differences."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we take security seriously. We use enterprise-grade encryption, regular security audits, and comply with SOC 2 Type II standards. Your data is backed up multiple times daily."
  },
  {
    question: "Do you offer custom integrations?",
    answer: "Yes, our Enterprise plan includes custom integrations. We can connect with virtually any system through our REST API or build custom solutions to meet your specific requirements."
  },
  {
    question: "What happens if I need to cancel?",
    answer: "You can cancel anytime with no penalties. We'll help you export your data in standard formats, and you'll retain access until the end of your billing period."
  }
];

export function FaqSection() {
  return (
    <Section id="faq">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="rounded-full px-4 py-2">
            Got Questions?
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Hisaab360
          </p>
        </div>

        <Card className="border-0">
          <CardContent className="">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`} 
                  className="border border-border shadow-soft rounded-3xl px-6 py-2"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}