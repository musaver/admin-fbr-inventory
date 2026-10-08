'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  Truck, 
  Calculator, 
  Scale, 
  Building2, 
  ShoppingBag, 
  DollarSign, 
  FileCheck, 
  Globe, 
  Plane, 
  CreditCard 
} from 'lucide-react';

const industries = [
  {
    icon: FileText,
    title: 'Company Registration',
    description: 'Complete business registration and incorporation services',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Truck,
    title: 'Admin & Supply Chain',
    description: 'Administrative support and supply chain management',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Calculator,
    title: 'Taxation & Litigation',
    description: 'Tax planning, compliance and legal dispute resolution',
    color: 'from-red-500 to-pink-500',
  },
  {
    icon: Scale,
    title: 'Corporate & Legal',
    description: 'Corporate governance and comprehensive legal services',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: Scale,
    title: 'Commerce',
    description: 'Lahore Chamber of Commerce',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Building2,
    title: 'Industry (LCCI) Support',
    description: 'Lahore Chamber of Commerce and Industry liaison services',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: ShoppingBag,
    title: 'Procurement Support',
    description: 'Strategic procurement and vendor management solutions',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: DollarSign,
    title: 'Accounting & Payroll',
    description: 'Complete bookkeeping, accounting and payroll management',
    color: 'from-emerald-500 to-green-500',
  },
  {
    icon: FileCheck,
    title: 'License & Permits',
    description: 'Business licensing and regulatory permit assistance',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Globe,
    title: 'Website Design',
    description: 'Professional web design, graphics and social media management',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Plane,
    title: 'Visa Services',
    description: 'Complete visa application and immigration support services',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: CreditCard,
    title: 'Financial Services',
    description: 'Comprehensive banking and financial advisory services',
    color: 'from-violet-500 to-purple-500',
  },
];

export default function Industries() {
  return (
    <section id="industries" className="py-16 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Business Services
            
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {industries.map((industry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105 text-center">
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${industry.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <industry.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {industry.title}
                </h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {industry.description}
                </p>

                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${industry.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
        >
          {[
            { number: '1K+', label: 'Happy Customers' },
            { number: '5M+', label: 'Items Managed' },
            { number: '99.9%', label: 'Uptime' },
            { number: '24/7', label: 'Support' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
