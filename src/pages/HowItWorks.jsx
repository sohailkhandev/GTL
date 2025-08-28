// this is how it works page
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#2069BA] to-[#1e40af] text-white py-20">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h1 className="text-5xl font-bold mb-6">How SRS Works</h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Discover how our Survey Reward Service platform connects companies
            with participants, creating a seamless ecosystem for research data
            collection and rewards.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Overview Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-16 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-[#2069BA] to-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Platform Overview
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              SRS is a research reward platform where companies post surveys and
              users submit responses to earn rewards and participate in exciting
              bonus systems.
            </p>
          </div>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-[#2069BA] to-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Company Setup
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Companies purchase survey points and create surveys with up to 12
              questions covering various topics like health, lifestyle, and
              products.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-[#2069BA] to-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              User Participation
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Users complete surveys, pass verification checks, and earn points
              for each response plus bonus opportunities.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-[#2069BA] to-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Survey Completion
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              When target responses are reached, surveys automatically close and
              companies receive comprehensive results with participant data.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-[#2069BA] to-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-2xl font-bold text-white">4</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Rewards & Bonuses
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Users redeem points for gift cards and participate in exciting
              bonus systems with multiple reward levels.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Companies Card */}
          <div className="bg-gradient-to-br from-[#2069BA] to-[#1e40af] rounded-2xl shadow-2xl p-8 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">For Companies</h3>
            <ul className="space-y-3 text-white/90">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Purchase survey points with flexible packages
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Create surveys with up to 12 questions
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Set target responses and auto-close surveys
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Download comprehensive results with participant data
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Transparent pricing with no hidden fees
              </li>
            </ul>
          </div>

          {/* Users Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">For Users</h3>
            <ul className="space-y-3 text-white/90">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Complete simple surveys to become full members
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Earn points for each survey response
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Participate in exciting bonus systems
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Redeem points for popular gift cards
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Access Google, Apple, and Amazon rewards
              </li>
            </ul>
          </div>
        </div>

        {/* Bonus System */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-16 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2a2 2 0 01-2-2zM12 8a2 2 0 100-4 2 2 0 000 4z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Exciting Bonus System
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Every survey response contributes to our bonus pools, giving users
              multiple opportunities to win additional rewards beyond their
              regular points.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl border border-yellow-200">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Lucky Bonus</h3>
              <p className="text-gray-600 text-sm mb-2">
                Regular bonus opportunities
              </p>
              <p className="text-yellow-600 font-bold">Frequent rewards</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Dream Bonus</h3>
              <p className="text-gray-600 text-sm mb-2">
                Medium-tier bonus rewards
              </p>
              <p className="text-purple-600 font-bold">Special opportunities</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl border border-red-200">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Miracle Bonus</h3>
              <p className="text-gray-600 text-sm mb-2">
                Premium bonus rewards
              </p>
              <p className="text-red-600 font-bold">Exclusive prizes</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h4 className="font-bold text-gray-800 mb-3 text-center">
              How It Works
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold mb-2">Each Survey Response:</p>
                <ul className="space-y-1">
                  <li>• Earn regular points for participation</li>
                  <li>• Contribute to bonus pools</li>
                  <li>• Multiple reward opportunities</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">Bonus Distribution:</p>
                <ul className="space-y-1">
                  <li>• Lucky: Regular bonus rewards</li>
                  <li>• Dream: Special bonus opportunities</li>
                  <li>• Miracle: Premium bonus prizes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Benefits */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-16 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Platform Benefits
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              SRS provides a secure, transparent platform for research data
              collection with multiple benefits for both companies and
              participants.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-[#2069BA] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Secure Platform</h3>
              <p className="text-gray-600 text-sm">
                Advanced security and data protection
              </p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-[#2069BA] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">
                Transparent Process
              </h3>
              <p className="text-gray-600 text-sm">
                Clear pricing and reward systems
              </p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-[#2069BA] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Quality Data</h3>
              <p className="text-gray-600 text-sm">
                Reliable research data collection
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-[#2069BA] to-[#1e40af] rounded-2xl shadow-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of companies and participants making a difference in
            research data collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-[#2069BA] px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Join as Participant
            </Link>
            <Link
              to="/register"
              className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Join as Company
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
