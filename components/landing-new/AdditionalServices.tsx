'use client';

import { motion } from 'framer-motion';
import { Headphones, BookOpen, Wrench, Users, Code, TrendingUp } from 'lucide-react';

const services = [
  {
    icon: Headphones,
    title: 'Priority Support',
    description: 'Get dedicated support with faster response times and priority handling.',
    features: ['24/7 live chat', 'Phone support', 'Dedicated account manager'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BookOpen,
    title: 'Training & Onboarding',
    description: 'Comprehensive training programs to get your team up to speed quickly.',
    features: ['Live training sessions', 'Video tutorials', 'Best practices guide'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Wrench,
    title: 'Custom Setup',
    description: 'Tailored configuration and setup services for your specific needs.',
    features: ['Custom workflows', 'Data migration', 'Integration setup'],
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Advanced user management and collaboration tools for larger teams.',
    features: ['Role-based access', 'Team analytics', 'Collaboration tools'],
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Code,
    title: 'API & Integrations',
    description: 'Connect with your existing tools and build custom integrations.',
    features: ['REST API access', 'Webhook support', 'Custom integrations'],
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: TrendingUp,
    title: 'Business Intelligence',
    description: 'Advanced analytics and reporting for data-driven decisions.',
    features: ['Custom dashboards', 'Predictive analytics', 'Export capabilities'],
    color: 'from-pink-500 to-rose-500',
  },
];

export default function AdditionalServices() {
  return (
    <section id="additional-services" className="py-15 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Additional&nbsp;
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Services
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Go beyond basic inventory management with our premium services and support options.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-8 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${service.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300 transition-colors">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
