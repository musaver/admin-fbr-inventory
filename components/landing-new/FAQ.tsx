'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'How quickly can I get started with Tax Mahir?',
    answer: 'You can be up and running in under 5 minutes! Simply sign up, import your data (or start fresh), and begin managing your inventory immediately. Our intuitive interface requires no training.',
  },
  {
    question: 'Can I import my existing inventory data?',
    answer: 'Absolutely! We support imports from Excel, CSV files, and most popular inventory management systems. Our migration team can also help with complex data transfers at no extra cost.',
  },
  {
    question: 'Is my data secure and backed up?',
    answer: 'Yes, we use bank-level encryption and store your data across multiple secure data centers. We perform automatic daily backups and maintain 99.9% uptime with our enterprise infrastructure.',
  },
  {
    question: 'Can multiple team members access the same account?',
    answer: 'Yes! All paid plans include team collaboration features with role-based permissions. You can control what each team member can see and do within your inventory system.',
  },
  {
    question: 'Do you offer integrations with other business tools?',
    answer: 'We integrate with 100+ popular business tools including Shopify, WooCommerce, QuickBooks, Stripe, and many more. We also provide a robust API for custom integrations.',
  },
  {
    question: 'What happens if I need to cancel my subscription?',
    answer: 'You can cancel anytime with no penalties. Your data remains accessible for 30 days after cancellation, and you can export everything before your account closes.',
  },
  {
    question: 'Is there a mobile app available?',
    answer: 'Yes! Our mobile apps for iOS and Android let you manage inventory on the go. Scan barcodes, update stock levels, and receive notifications wherever you are.',
  },
  {
    question: 'Do you provide customer support?',
    answer: 'We offer 24/7 support via live chat and email for all users. Pro plan customers also get phone support and a dedicated account manager for personalized assistance.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 px-6 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Frequently Asked
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Got questions? We've got answers. Here are the most common questions about Tax Mahir.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group"
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-800/30 transition-colors duration-300"
                >
                  <h3 className="text-lg font-semibold text-white pr-8 group-hover:text-purple-300 transition-colors">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                    )}
                  </div>
                </button>
                
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? 'auto' : 0,
                    opacity: openIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-6">
                    <p className="text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 mb-6">
            Still have questions? We're here to help!
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer">
            <span className="text-purple-300 font-semibold">Contact our support team</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
