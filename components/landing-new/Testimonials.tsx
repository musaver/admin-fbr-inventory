'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Kashif Bashir',
    role: 'CEO - Ms EIDS Engineering',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=100&h=100&fit=crop&crop=face',
    content: 'The FBR invoicing system makes billing so quick and hassle-free. Now I can focus more on my customers instead of paperwork.',
    rating: 5,
  },
  {
    name: 'Kashif Zaheer Alvi',
    role: 'CEO - EEPCON Pvt. Ltd.',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=100&h=100&fit=crop&crop=face',
    content: 'Inventory tracking and ERP integration have streamlined our operations. We always know our stock levels in real time.',
    rating: 5,
  },
  {
    name: 'Zeeshan Rasheed',
    role: 'CEO - Ms Industrial Integrity (Indegrity)',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100&h=100&fit=crop&crop=face',
    content: 'Tax-compliant invoices are generated in seconds. The reporting dashboard saves me hours of manual work every week.',
    rating: 5,
  },
  {
    name: 'Mr. Aisam Khan',
    role: 'CEO - Ms Ali International',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=100&h=100&fit=crop&crop=face',
    content: 'This software keeps my invoices, payments, and stock perfectly aligned. Its a must-have for any online business.',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Customers
            <br />
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Feedback
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            See what our customers are saying about their inventory management journey.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              {/* Chat bubble */}
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-8 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-purple-400 mb-4" />
                
                {/* Content */}
                <p className="text-lg text-gray-300 leading-relaxed mb-6 group-hover:text-white transition-colors">
                  "{testimonial.content}"
                </p>

                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-4">
                  
                  <div>
                    <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>

                {/* Chat bubble tail */}
                <div className="absolute -bottom-2 left-8 w-4 h-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rotate-45 border-r border-b border-gray-700/50" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
