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

  const stats = [
    { label: 'Active Members', value: '45+' },
    { label: 'Processed Payments', value: '$130K+' },
    { label: 'Uptime', value: '99.9%' },
  ];

  const techStack = ['Next.js 15', 'TypeScript', 'Drizzle ORM', 'Stripe'];

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
    <div className="min-h-screen bg-[#f7f9fb] text-[#2C3E50]">
      {/* Navigation */}
      <nav className="border-b border-[#d6dde5] bg-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
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
              <Link href="#features" className="font-medium text-white transition-colors hover:text-[#2C3E50]">
                Features
              </Link>
              <Link href="#about" className="font-medium text-white transition-colors hover:text-[#2C3E50]">
                About
              </Link>
              <button 
                onClick={() => setIsSignInOpen(true)}
                className="rounded-lg border border-[#f38d68] bg-[#f38d68] px-6 py-2 font-semibold text-black transition-colors duration-200 hover:bg-[#f5a07f]"
              >
                Sign In
              </button>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg border border-[#d6dde5] p-2 text-white transition-colors hover:bg-[#f7f9fb] hover:text-[#2C3E50]"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="pb-6 md:hidden">
              <div className="flex flex-col gap-3 rounded-xl border border-[#d6dde5] bg-white p-4">
                <Link href="#features" className="font-medium text-[#788896] transition-colors hover:text-[#2C3E50]" onClick={() => setIsMobileMenuOpen(false)}>
                  Features
                </Link>
                <Link href="#about" className="font-medium text-[#788896] transition-colors hover:text-[#2C3E50]" onClick={() => setIsMobileMenuOpen(false)}>
                  About
                </Link>
                <button 
                  onClick={() => {
                    setIsSignInOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="rounded-lg border border-[#f38d68] bg-[#f38d68] px-6 py-2 text-left font-semibold text-black transition-colors duration-200 hover:bg-[#f5a07f]"
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
      <section className="relative py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="mb-4 inline-flex rounded-full border border-[#f38d68] bg-[#fff3eb] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2C3E50]">
                Ensemble Operations System
              </p>
              <h1 className="mb-6 text-5xl font-bold leading-tight text-[#2C3E50] sm:text-6xl lg:text-7xl">
                Darksky Percussion
                <span className="mt-2 block text-[#f38d68]">Admin Platform</span>
              </h1>
              <p className="mb-8 max-w-2xl text-xl leading-relaxed text-[#788896]">
                The complete administrative solution for managing indoor percussion members, payments, and operations.
                Built for efficiency and designed for daily use by real staff.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-[#f38d68] bg-[#f38d68] px-8 py-4 text-center text-lg font-bold text-black transition-colors duration-200 hover:bg-[#f5a07f]"
                >
                  Access Dashboard
                </Link>
                <Link
                  href="#features"
                  className="rounded-xl border border-[#d6dde5] bg-white px-8 py-4 text-center text-lg font-bold text-[#2C3E50] transition-colors duration-200 hover:bg-[#f7f9fb]"
                >
                  Explore Features
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#d6dde5] bg-white p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#788896]">{stat.label}</p>
                  <p className="mt-2 text-4xl font-bold text-[#2C3E50]">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-4xl font-bold leading-tight text-[#2C3E50] md:text-5xl">
              Everything needed to run your ensemble operation
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-[#788896]">
              From member enrollment to reconciliation, every core workflow is covered in one place.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#d6dde5] bg-white p-8 transition-colors duration-200 hover:bg-[#f7f9fb]"
              >
                <div className="mb-4 inline-flex rounded-xl border border-[#d6dde5] bg-[#f7f9fb] px-3 py-2 text-3xl">{feature.icon}</div>
                <h3 className="mb-4 text-2xl font-bold text-[#2C3E50]">{feature.title}</h3>
                <p className="leading-relaxed text-[#788896]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-[#d6dde5] bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3">
            {stats.map((stat) => (
              <div key={`mid-${stat.label}`} className="rounded-2xl border border-[#d6dde5] bg-[#f7f9fb] px-6 py-8">
                <div className="mb-2 text-4xl font-bold text-[#2C3E50] md:text-5xl">{stat.value}</div>
                <div className="text-xl text-[#788896]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-8 text-4xl font-bold text-[#2C3E50] md:text-5xl">
              Built for Darksky Percussion
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <p className="mb-6 text-xl leading-relaxed text-[#788896]">
                  Our administrative platform streamlines every aspect of percussion ensemble management, from member enrollment
                  to payment processing. With integrated Stripe payments, comprehensive reporting, and real-time
                  dashboard insights, managing your ensemble has never been easier.
                </p>
                <p className="mb-6 text-xl leading-relaxed text-[#788896]">
                  Built with modern web technologies including Next.js, TypeScript, and Drizzle ORM, our platform 
                  delivers enterprise-grade reliability with an intuitive user experience.
                </p>
                <div className="flex flex-wrap gap-3">
                  {techStack.map((tech) => (
                    <span key={tech} className="rounded-full border border-[#d6dde5] bg-white px-4 py-2 text-sm font-medium text-[#2C3E50]">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#d6dde5] bg-white p-8">
                <h3 className="mb-6 text-2xl font-bold text-[#2C3E50]">Key Capabilities</h3>
                <ul className="space-y-4">
                  <li className="flex items-center text-[#788896]">
                    <span className="mr-3 rounded-full border border-emerald-400 bg-emerald-100 px-2 py-0.5 text-emerald-900">✓</span>
                    Automated payment reconciliation
                  </li>
                  <li className="flex items-center text-[#788896]">
                    <span className="mr-3 rounded-full border border-emerald-400 bg-emerald-100 px-2 py-0.5 text-emerald-900">✓</span>
                    Real-time financial reporting
                  </li>
                  <li className="flex items-center text-[#788896]">
                    <span className="mr-3 rounded-full border border-emerald-400 bg-emerald-100 px-2 py-0.5 text-emerald-900">✓</span>
                    Member database management
                  </li>
                  <li className="flex items-center text-[#788896]">
                    <span className="mr-3 rounded-full border border-emerald-400 bg-emerald-100 px-2 py-0.5 text-emerald-900">✓</span>
                    Stripe payment integration
                  </li>
                  <li className="flex items-center text-[#788896]">
                    <span className="mr-3 rounded-full border border-emerald-400 bg-emerald-100 px-2 py-0.5 text-emerald-900">✓</span>
                    Audit trail and logging
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl border border-[#d6dde5] bg-white px-8 py-12">
            <h2 className="mb-6 text-4xl font-bold text-[#2C3E50] md:text-5xl">
            Ready to streamline your percussion ensemble management?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-[#788896]">
            Join the modern way of managing organizational operations with our comprehensive administrative platform.
            </p>
            <a 
              href="mailto:kheffy.cervantez@gmail.com?subject=Interest in DarkSky Admin App&body=Hi there!%0A%0AI'm interested in your DarkSky Admin app and want to learn more about how you built it! The platform looks impressive and I'd love to know more about the technologies and approach you used.%0A%0ALooking forward to hearing from you!"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl border border-[#f38d68] bg-[#f38d68] px-8 py-4 text-lg font-bold text-black transition-colors duration-200 hover:bg-[#f5a07f]"
            >
              Get Started Today
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
