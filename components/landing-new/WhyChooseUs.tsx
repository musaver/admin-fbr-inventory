'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Users, Award, Clock, Heart } from 'lucide-react';

const reasons = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption and security protocols to keep your data safe.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work seamlessly with your team with role-based permissions.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Award,
    title: 'Training and on boarding',
    description: 'Comprehensive training programs to get your team up to speed quickly.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Round-the-clock customer support whenever you need help.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Zap,
    title: 'Accounting ',
    description: 'Comprehensive financial management with real-time reporting and expense tracking.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Heart,
    title: 'API & Integration',
    description: 'Connect with your existing tools and build custom integrations.',
    color: 'from-red-500 to-pink-500',
  },
];

export default function WhyChooseUs() {
  return (
    <section id="why-choose-us" className="py-16 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Why Choose
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Tax Mahir?
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Tax Mahir makes business easy. From FBR invoicing and bulk uploads to inventory management and compliance, everything is in one secure, cost-effective platform – so you can focus on growth
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-8 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl text-center">
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${reason.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <reason.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
                  {reason.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {reason.description}
                </p>

                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${reason.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
