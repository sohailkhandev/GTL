// privacy policy page
const PrivacyPolicy = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">
        At GTL, your privacy is our top priority. We are committed to protecting
        the confidentiality and security of your data while enabling safe data
        interactions between users and companies.
      </p>
      <h2 className="text-xl font-semibold mt-4 mb-2">What We Collect</h2>
      <p className="mb-4">
        We collect only the health and genetic survey data you choose to submit.
        No personally identifiable information is shared with companies without
        your explicit consent.
      </p>
      <h2 className="text-xl font-semibold mt-4 mb-2">How We Use Your Data</h2>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>Data is made searchable to companies under paid access.</li>
        <li>
          Companies never receive your identity unless you choose to share it.
        </li>
        <li>GTL does not sell your data directly to third parties.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-4 mb-2">Your Control</h2>
      <p>
        You have full control over your submissions and may request data removal
        at any time. GTL only monetizes access to anonymized data searches,
        ensuring your privacy remains protected.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
