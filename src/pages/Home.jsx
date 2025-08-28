// this is home page

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSurveyContext } from "../context/SurveyContext";
import ProgressiveJackpot from "../components/ProgressiveJackpot";
import WinnersList from "../components/WinnersList";

const Home = () => {
  const { user } = useAppContext();
  const { surveys, fetchSurveys, isLoadingSurveys } = useSurveyContext();

  // Fetch surveys when component mounts and user is of type "user"
  useEffect(() => {
    if (user && user.type === "user") {
      fetchSurveys();
    }
  }, [user, fetchSurveys]);

  // Filter surveys to show only active ones
  const activeSurveys = surveys.filter(
    (survey) =>
      survey.status === "active" &&
      survey.participantsCount < survey.targetParticipants
  );

  return (
    <div className="bg-white">
      {/* Hero Section - Clean, Minimal Design */}
      <section className="bg-gradient-to-r from-[#2069BA] to-[#1e40af] text-white py-24">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h1 className="text-6xl font-bold mb-8">Welcome to SRS</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed">
            This service provides Progressive Rewards for survey participation.
          </p>
          {/* <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 text-blue-100">
            Your trusted survey reward platform connecting individuals with
            research businesses. Complete surveys, earn rewards, and
            contribute to scientific discoveries.
          </p> */}

          {/* Navigation Links for Regular Users Only (Not Business/Admin) */}
          {user && user.type === "user" && (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/dashboard"
                className="bg-[#2069BA] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#1e40af] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-white/20"
              >
                View Dashboard
              </Link>
              <Link
                to="/participate"
                className="bg-black text-white px-10 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-white/20"
              >
                Join a Survey Now
              </Link>
            </div>
          )}

          {/* Navigation Links for Non-Logged In Users */}
          {!user && (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/login"
                className="bg-black text-white px-10 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-white/20"
              >
                Join a Survey Now
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Survey List - Game/Contest Board Style - Only for Users */}
      {user && user.type === "user" && (
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 text-center text-[#2069BA]">
              Available Surveys
            </h2>

            {isLoadingSurveys ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">
                    Loading available surveys...
                  </p>
                </div>
              </div>
            ) : activeSurveys.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">
                    No surveys available at the moment.
                  </p>
                  <p className="text-gray-400">
                    Please check back later for new opportunities.
                  </p>
                </div>
              </div>
            ) : (
              /* Survey Grid - Dynamic from Database */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeSurveys.slice(0, 6).map((survey) => {
                  const isQuotaReached =
                    survey.participantsCount >= survey.targetParticipants;
                  const progressPercentage = Math.round(
                    ((survey.participantsCount || 0) /
                      (survey.targetParticipants || 1)) *
                      100
                  );

                  return (
                    <div
                      key={survey.id}
                      className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                    >
                      <div className="text-center mb-6">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          {survey.pointsReward || "20"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Reward Points
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-[#2069BA] mb-4">
                        {survey.title}
                      </h3>
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium">
                            {survey.category || "Research"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Time Left:</span>
                          <span className="font-medium text-orange-600">
                            {survey.targetParticipants -
                              survey.participantsCount}{" "}
                            spots left
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isQuotaReached
                                ? "bg-[#2069BA]"
                                : progressPercentage >= 80
                                ? "bg-orange-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(progressPercentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <Link
                        to="/participate"
                        className="block w-full bg-[#2069BA] text-white py-3 rounded-xl font-semibold hover:bg-[#1e40af] transition-colors duration-200 text-center"
                      >
                        Join
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View All Surveys Button */}
            {activeSurveys.length > 6 && (
              <div className="text-center mt-8">
                <Link
                  to="/participate"
                  className="inline-block bg-[#2069BA] hover:bg-[#1e40af] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  View All Available Surveys
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section - Clean Cards */}
      <section className="max-w-6xl mx-auto py-20 px-6">
        {/* Top Row - 2 Cards */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
            <h2 className="text-3xl font-bold mb-6 text-[#2069BA]">
              For Participants
            </h2>
            <p className="mb-6 text-gray-600 text-lg leading-relaxed">
              Complete surveys, earn Progressive Rewards, and contribute to
              scientific research while maintaining full control over your data.
            </p>
            <Link
              to="/login"
              className="text-[#2069BA] hover:text-[#1e40af] font-semibold text-lg transition-colors duration-200"
            >
              Participate in surveys →
            </Link>
          </div>

          <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
            <h2 className="text-3xl font-bold mb-6 text-[#2069BA]">
              For Researchers
            </h2>
            <p className="mb-6 text-gray-600 text-lg leading-relaxed">
              Access a diverse pool of survey participants and collect valuable
              research data through our secure platform.
            </p>
            <Link
              to="/business/search"
              className="text-[#2069BA] hover:text-[#1e40af] font-semibold text-lg transition-colors duration-200"
            >
              Search database →
            </Link>
          </div>
        </div>

        {/* Bottom Row - Full Width */}
        <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
          <h2 className="text-3xl font-bold mb-6 text-[#2069BA]">
            How It Works
          </h2>
          <ol className="list-decimal pl-6 space-y-4 text-gray-600 text-lg">
            <li>Complete surveys and earn Progressive Rewards</li>
            <li>Get matched with relevant research studies</li>
            <li>Maintain full control over your data</li>
            <li>Surveys automatically close when quotas are reached</li>
          </ol>
        </div>
      </section>

      {/* Progressive Reward Section - Clean Design */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6 text-center text-[#2069BA]">
            Progressive Reward System
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-center mb-12 text-lg leading-relaxed">
            Complete surveys to contribute to our Progressive Rewards. The more
            participants, the bigger the rewards become for everyone.
          </p>
          <ProgressiveJackpot />
        </div>
      </section>

      {/* Winners List Section */}
      {/* <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <WinnersList />
        </div>
      </section> */}

      {/* Privacy Section - Clean Design */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6 text-center text-[#2069BA]">
            Your Data Privacy is Our Priority
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-center mb-12 text-lg leading-relaxed">
            At SRS, we take your privacy seriously. All survey responses are
            encrypted, and you maintain full control over what information is
            shared and with whom.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <FeatureItem text="End-to-end encryption" />
            <FeatureItem text="Granular consent controls" />
            <FeatureItem text="Transparent data usage" />
          </div>
        </div>
      </section>

      {/* Testimonials Section - Clean Design */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-[#2069BA] mb-12">
            What Our Users Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Testimonial
              name="Sarah L."
              text="I love completing surveys, earning Progressive Rewards, and contributing to important research."
            />
            <Testimonial
              name="Dr. Alex M."
              text="SRS made it easy for our team to find participants for groundbreaking survey research."
            />
            <Testimonial
              name="James R."
              text="The Progressive Rewards and secure platform gave me confidence to participate in surveys."
            />
          </div>
        </div>
      </section>

      {/* Call to Action - Clean Design */}
      <section className="bg-[#2069BA] py-20 text-white text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to make a difference?</h2>
        <p className="mb-8 text-lg text-blue-100">
          Join SRS today and contribute to groundbreaking research through
          surveys while earning Progressive Rewards.
        </p>
        {!user && (
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              to="/login"
              className="bg-white text-[#2069BA] px-10 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-black text-white px-10 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
            >
              Create Account
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

// Reusable Feature Component - Clean Design
const FeatureItem = ({ text }) => (
  <div className="flex items-center bg-white px-8 py-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
    <svg
      className="w-7 h-7 text-[#2069BA] mr-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
    <span className="text-gray-700 font-medium text-lg">{text}</span>
  </div>
);

// Reusable Testimonial Component - Clean Design
const Testimonial = ({ name, text }) => (
  <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
    <p className="italic text-gray-600 mb-6 text-lg leading-relaxed">
      "{text}"
    </p>
    <h4 className="font-bold text-[#2069BA] text-xl">{name}</h4>
  </div>
);

export default Home;
