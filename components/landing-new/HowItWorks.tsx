'use client';

import { motion } from 'framer-motion';
import { UserPlus, Upload, BarChart, Rocket } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Sign Up & Setup',
    description: 'Create your account in seconds and customize your workspace.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    step: '02',
    icon: Upload,
    title: 'Import Your Data',
    description: 'Upload your existing inventory or start fresh with our templates.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    step: '03',
    icon: BarChart,
    title: 'Track & Analyze',
    description: 'Monitor your inventory in real-time with powerful analytics.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    step: '04',
    icon: Rocket,
    title: 'Scale & Grow',
    description: 'Use insights to optimize operations and accelerate growth.',
    color: 'from-orange-500 to-red-500',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          On Boarding&nbsp;
            
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Process
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Get started in minutes, not hours. Our streamlined process gets you up and running fast.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 opacity-30 transform -translate-y-1/2" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group relative"
              >
                <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-8 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl text-center">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {step.step}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${step.color} mb-6 mt-4 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {step.description}
                  </p>

                  {/* Hover gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
