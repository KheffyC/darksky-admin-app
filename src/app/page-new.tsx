import Image from "next/image";
import Link from "next/link";

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image
                src="/DSP_LOGO.png"
                alt="Darksky Productions Logo"
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
              <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Darksky Productions
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                Admin Platform
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The complete administrative solution for managing choir members, payments, and operations.
              Built for efficiency, designed for scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard"
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Access Dashboard
              </Link>
              <button className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-8 py-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-bold text-lg border border-gray-600">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything you need to manage your choir
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
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">100+</div>
              <div className="text-xl text-gray-300">Active Members</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">$50K+</div>
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
              Built for Darksky Productions
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  Our administrative platform streamlines every aspect of choir management, from member enrollment 
                  to payment processing. With integrated Stripe payments, comprehensive reporting, and real-time 
                  dashboard insights, managing your choir has never been easier.
                </p>
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  Built with modern web technologies including Next.js, TypeScript, and Prisma, our platform 
                  delivers enterprise-grade reliability with an intuitive user experience.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">Next.js 15</span>
                  <span className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-medium">TypeScript</span>
                  <span className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium">Prisma</span>
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
            Ready to streamline your choir management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the modern way of managing choir operations with our comprehensive administrative platform.
          </p>
          <Link 
            href="/dashboard"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            Get Started Today
          </Link>
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
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">
              © 2025 Darksky Productions. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
