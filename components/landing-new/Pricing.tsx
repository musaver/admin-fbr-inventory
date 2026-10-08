'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    monthlyPrice: 2500,
    yearlyPrice: 25000,
    description: 'Perfect for small businesses',
    features: [
      'Up to 50 FBR Invoices',
      'Basic reporting',
      'Support',
      'Up to 5 Free Sub Accounts',
    ],
  },
  {
    name: 'Growth',
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    description: 'For growing businesses',
    popular: true,
    features: [
      'Up to 100 FBR Invoices',
      'Inventory Management',
      'Upto 10,000 Products',
      'Reporting',
      'Support',
      'Up to 10 Free Sub Accounts',
    ],
  },
  {
    name: 'Pro',
    icon: Rocket,
    color: 'from-blue-500 to-cyan-500',
    monthlyPrice: 7500,
    yearlyPrice: 8000,
    description: 'For large enterprises',
    features: [
      '1000+ FBR Invoices',
      'Inventory Management',
      'Upto 50,000 Products',
      'Reporting',
      'Support',
      'Up to 20 Free Sub Accounts',
    ],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-16 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Simple&nbsp;
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Pricing Plans
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
            Choose the perfect plan for your business. All plans include a 14-day free trial.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-800/50 rounded-full p-2 border border-gray-700/50">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                !isYearly
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                isYearly
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`group relative ${plan.popular ? 'scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className={`relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-8 backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'border-purple-500/50 shadow-2xl shadow-purple-500/25'
                  : 'border-gray-700/50 hover:border-gray-600/50'
              }`}>
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${plan.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <plan.icon className="w-8 h-8 text-white" />
                </div>

                {/* Header */}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">
                      Rs. {(isYearly ? plan.yearlyPrice : plan.monthlyPrice).toLocaleString('en-IN')}
                    </span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-green-400 mt-2">
                      Save Rs. {((plan.monthlyPrice - plan.yearlyPrice) * 12).toLocaleString('en-IN')}/year
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={`w-full py-3 text-lg font-semibold rounded-2xl transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg shadow-purple-500/25'
                      : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border-gray-600'
                  }`}
                >
                  Start Free Trial
                </Button>

                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${plan.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
