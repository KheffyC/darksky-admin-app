"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SignInModal from "@/components/SignInModal";
import InfoModal from "@/components/InfoModal";

const features = [
  {
    title: "Member Management",
    description: "Comprehensive member database with contact information, section assignments, and tuition tracking.",
    icon: "👥",
  },
  {
    title: "Payment Processing",
    description: "Seamless integration with Stripe for automated payment processing and manual payment entry.",
    icon: "💳",
  },
  {
    title: "Payment Reconciliation",
    description: "Smart matching system to assign unmatched payments to members with error handling and validation.",
    icon: "🔄",
  },
  {
    title: "Financial Reporting",
    description: "Detailed ledgers, payment histories, and comprehensive financial reports for better insights.",
    icon: "📊",
  },
  {
    title: "Tuition Management",
    description: "Dynamic tuition amount adjustments with full audit trail and change logging.",
    icon: "🎓",
  },
  {
    title: "Real-time Dashboard",
    description: "Live overview of key metrics, recent payments, and member statistics at a glance.",
    icon: "📈",
  },
];

export default function LandingPage() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'support' | null>(null);

  const modalContent = {
    privacy: {
      heading: "Privacy Policy",
      message: `Last updated: July 12, 2025

At DarkSky Admin Platform, we are committed to protecting your privacy and ensuring the security of your personal information.

Information We Collect:
• Account information (name, email address)
• Usage data and analytics
• Payment information (processed securely through Stripe)
• Member and organizational data you input into the system

How We Use Your Information:
• To provide and maintain our service
• To process payments and manage subscriptions
• To communicate with you about your account
• To improve our platform and user experience
• To comply with legal obligations

Data Protection:
• All data is encrypted in transit and at rest
• We use industry-standard security measures
• Payment information is processed securely through Stripe
• We do not sell or share your personal information with third parties

Your Rights:
• Access and update your personal information
• Request deletion of your account and data
• Export your data in a portable format
• Opt out of non-essential communications

Contact Us:
If you have any questions about this Privacy Policy, please contact us at kheffy.cervantez@gmail.com.`
    },
    terms: {
      heading: "Terms of Service",
      message: `Last updated: July 12, 2025

Welcome to DarkSky Admin Platform. By using our service, you agree to these terms.

Service Description:
DarkSky Admin Platform is a comprehensive administrative solution for managing percussion ensemble members, payments, and operations.

Acceptable Use:
• Use the service only for lawful purposes
• Do not attempt to breach security or access unauthorized areas
• Respect the privacy and rights of other users
• Do not use the service to transmit harmful or illegal content

Account Responsibilities:
• Maintain the security of your account credentials
• Provide accurate and current information
• Notify us immediately of any unauthorized use
• You are responsible for all activity under your account

Payment Terms:
• Subscription fees are billed in advance
• Payments are processed securely through Stripe
• Refunds may be provided at our discretion
• Service may be suspended for non-payment

Data and Content:
• You retain ownership of your data
• We may use aggregated, anonymized data for service improvement
• You grant us permission to process your data to provide the service
• Regular backups are performed, but you should maintain your own backups

Limitation of Liability:
• The service is provided "as is" without warranties
• We are not liable for indirect or consequential damages
• Our liability is limited to the amount you paid for the service
• We do not guarantee uninterrupted or error-free service

Termination:
• You may cancel your account at any time
• We may suspend or terminate accounts for violations
• Upon termination, you may export your data for a limited time

Contact Us:
For questions about these terms, contact us at kheffy.cervantez@gmail.com.`
    },
    support: {
      heading: "Support",
      message: `Welcome to DarkSky Admin Platform Support!

About the Developer:
Hi! I'm a solo developer who's passionate about building functional, practical applications that can make a real difference in people's lives. This project started as a way to solve real administrative challenges for percussion ensembles, and I've had a blast bringing it to life.

What I'm All About:
• Creating clean, efficient solutions to real-world problems
• Building with modern technologies and best practices
• Learning and growing through each project
• Making tools that genuinely help people be more productive

Getting Help:
While this is a solo project built for fun and learning, I'm committed to making it as useful as possible. If you need assistance:

📧 Email: kheffy.cervantez@gmail.com
• Bug reports and technical issues
• Feature requests and suggestions
• General questions about the platform
• Feedback on your experience

Response Time:
Since this is a passion project, please allow 1-3 business days for responses. I do my best to address issues quickly, but I also have a day job!

Common Issues:
• Payment processing questions - usually Stripe-related
• Data import/export - CSV formatting is important
• User permissions - make sure roles are set correctly
• Browser compatibility - works best in modern browsers

Philosophy:
I believe technology should solve problems, not create them. Every feature in this platform exists because it addresses a real need. If something isn't working as expected or could be better, I want to hear about it!

Thanks for using DarkSky Admin Platform. Your feedback helps make it better for everyone! 🥁`
    }
  };

  const closeModal = () => setActiveModal(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image
                src="/DSP_LOGO.png"
                alt="Darksky Percussion Logo"
                width={180}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#about" className="text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <button 
                onClick={() => setIsSignInOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Sign In
              </button>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white p-2"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-6">
              <div className="flex flex-col space-y-4">
                <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                  Features
                </Link>
                <Link href="#about" className="text-gray-300 hover:text-white transition-colors">
                  About
                </Link>
                <button 
                  onClick={() => setIsSignInOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-left"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
      <InfoModal 
        isOpen={activeModal !== null}
        onClose={closeModal}
        heading={activeModal ? modalContent[activeModal].heading : ""}
        message={activeModal ? modalContent[activeModal].message : ""}
      />

      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Darksky Percussion
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                Admin Platform
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The complete administrative solution for managing indoor percussion members, payments, and operations.
              Built for efficiency, designed for scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard"
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Access Dashboard
              </Link>
              <Link 
                href="#features"
                className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-8 py-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-bold text-lg border border-gray-600"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything you need to manage your percussion ensemble
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From member enrollment to payment processing, our comprehensive platform handles it all
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:transform hover:-translate-y-2"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">45+</div>
              <div className="text-xl text-gray-300">Active Members</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">$130K+</div>
              <div className="text-xl text-gray-300">Processed Payments</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
              <div className="text-xl text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Built for Darksky Percussion
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  Our administrative platform streamlines every aspect of percussion ensemble management, from member enrollment
                  to payment processing. With integrated Stripe payments, comprehensive reporting, and real-time
                  dashboard insights, managing your ensemble has never been easier.
                </p>
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  Built with modern web technologies including Next.js, TypeScript, and Drizzle ORM, our platform 
                  delivers enterprise-grade reliability with an intuitive user experience.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">Next.js 15</span>
                  <span className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-medium">TypeScript</span>
                  <span className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium">Drizzle ORM</span>
                  <span className="bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full text-sm font-medium">Stripe</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-6">Key Capabilities</h3>
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Automated payment reconciliation
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Real-time financial reporting
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Member database management
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Stripe payment integration
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Audit trail and logging
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-6 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to streamline your percussion ensemble management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the modern way of managing organizational operations with our comprehensive administrative platform.
          </p>
          <a 
            href="mailto:kheffy.cervantez@gmail.com?subject=Interest in DarkSky Admin App&body=Hi there!%0A%0AI'm interested in your DarkSky Admin app and want to learn more about how you built it! The platform looks impressive and I'd love to know more about the technologies and approach you used.%0A%0ALooking forward to hearing from you!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            Get Started Today
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Image
                src="/DSP_LOGO.png"
                alt="Darksky Productions Logo"
                width={150}
                height={50}
                className="h-10 w-auto"
              />
            </div>
            <div className="flex space-x-6">
              <button 
                onClick={() => setActiveModal('privacy')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => setActiveModal('terms')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => setActiveModal('support')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Support
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">
              © 2025 K-Dot Designs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
