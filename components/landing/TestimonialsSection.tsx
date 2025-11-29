import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    name: "Sarah Johnson",
    position: "Store Manager",
    company: "Fashion Forward Boutique",
    content: "Hisaab360 reduced our stock management time by 75%. The automated alerts have prevented stockouts completely.",
    rating: 5,
    improvement: "75% time savings"
  },
  {
    name: "Mike Chen",
    position: "Operations Director",
    company: "TechHub Electronics",
    content: "The reporting features give us incredible insights. We've increased efficiency by 60% since implementing this system.",
    rating: 5,
    improvement: "60% efficiency boost"
  },
  {
    name: "Lisa Rodriguez",
    position: "Owner",
    company: "Corner Cafe & Bakery",
    content: "Perfect for our restaurant! Ingredient tracking and recipe management have streamlined our entire operation.",
    rating: 5,
    improvement: "Streamlined operations"
  }
];

export function TestimonialsSection() {
  return (
    <Section className="dark bg-gradient-subtle text-white">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-white">
          Client Success Stories
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          See how businesses have transformed their operations with Hisaab360
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
        <div className="relative">
          <Image 
            src="/landing-assets/team-collaboration.jpg" 
            alt="Business team collaboration" 
            width={600}
            height={400}
            className="w-full h-auto rounded-3xl shadow-strong"
          />
          <div className="absolute inset-0 bg-black/20 rounded-3xl"></div>
        </div>
        <div className="grid gap-8">
          {testimonials.slice(0, 2).map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 rounded-3xl bg-white/10 backdrop-blur-sm">
              <CardContent className="p-8 space-y-6">
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-white text-white" />
                  ))}
                </div>
                <blockquote className="text-white/90 leading-relaxed italic">"{testimonial.content}"</blockquote>
                <div className="space-y-1">
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-white/70">{testimonial.position} at {testimonial.company}</div>
                  <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium text-white">
                    {testimonial.improvement}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-8 max-w-4xl mx-auto">
        {testimonials.slice(2).map((testimonial, index) => (
          <Card key={index + 2} className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 rounded-3xl bg-white/10 backdrop-blur-sm">
            <CardContent className="p-8 space-y-6 text-center">
              <div className="flex space-x-1 justify-center">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-white text-white" />
                ))}
              </div>
              <blockquote className="text-white/90 leading-relaxed italic text-xl">"{testimonial.content}"</blockquote>
              <div className="space-y-1">
                <div className="font-semibold text-white text-lg">{testimonial.name}</div>
                <div className="text-white/70">{testimonial.position} at {testimonial.company}</div>
                <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium text-white">
                  {testimonial.improvement}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}