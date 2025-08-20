// this is home page

import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h1 className="text-5xl font-bold mb-6">Welcome to GTL</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Your secure genetic data brokerage platform connecting individuals
            with research institutions. Contribute to science, control your
            data, and unlock new discoveries.
          </p>
          <Link
            to="/login"
            className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-2xl font-semibold mb-3 text-blue-700">
            For Participants
          </h2>
          <p className="mb-4 text-gray-600">
            Contribute to scientific research by sharing your genetic and health
            data securely.
          </p>
          <Link to="/login" className="text-blue-600 hover:underline">
            Participate in surveys →
          </Link>
        </div>

        <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-2xl font-semibold mb-3 text-blue-700">
            For Researchers
          </h2>
          <p className="mb-4 text-gray-600">
            Find the perfect cohort for your study with our advanced search
            tools and trusted participants.
          </p>
          <Link
            to="/institution/search"
            className="text-blue-600 hover:underline"
          >
            Search database →
          </Link>
        </div>

        <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-2xl font-semibold mb-3 text-blue-700">
            How It Works
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-600">
            <li>Complete secure health surveys</li>
            <li>Get matched with relevant studies</li>
            <li>Maintain full control over data sharing</li>
          </ol>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-4 text-center text-blue-700">
            Your Data Privacy is Our Priority
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-center mb-8">
            At GTL, we take your privacy seriously. All data is encrypted, and
            you maintain full control over what information is shared and with
            whom.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <FeatureItem text="End-to-end encryption" />
            <FeatureItem text="Granular consent controls" />
            <FeatureItem text="Transparent data usage" />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold text-blue-700 mb-6">
            What Our Users Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Testimonial
              name="Sarah L."
              text="I love being part of important research while keeping full control of my data."
            />
            <Testimonial
              name="Dr. Alex M."
              text="GTL made it easy for our team to find participants for groundbreaking genetic research."
            />
            <Testimonial
              name="James R."
              text="Knowing my data is encrypted and safe gave me confidence to participate."
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 py-16 text-white text-center">
        <h2 className="text-3xl font-semibold mb-4">
          Ready to make a difference?
        </h2>
        <p className="mb-6">
          Join GTL today and contribute to groundbreaking genetic research.
        </p>
        <Link
          to="/login"
          className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          Sign Up Now
        </Link>
      </section>
    </div>
  );
};

// Reusable Feature Component
const FeatureItem = ({ text }) => (
  <div className="flex items-center bg-gray-50 px-4 py-3 rounded-md shadow-sm">
    <svg
      className="w-5 h-5 text-green-500 mr-2"
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
    <span className="text-gray-700">{text}</span>
  </div>
);

// Reusable Testimonial Component
const Testimonial = ({ name, text }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <p className="italic text-gray-600 mb-4">"{text}"</p>
    <h4 className="font-semibold text-blue-700">{name}</h4>
  </div>
);

export default Home;
