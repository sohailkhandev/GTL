// this is how it works page
const HowItWorks = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">How It Works</h1>
      <p className="mb-4">
        GTL is a privacy-preserving data brokerage platform designed to make
        health and genetic data exchange safer, simpler, and more rewarding for
        everyone.
      </p>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>
          🔐 <strong>Users</strong> safely submit health and genetic survey
          data.
        </li>
        <li>
          🔎 <strong>Companies</strong> search this data through paid access.
        </li>
        <li>
          💬 <strong>Rewards and interactions</strong> are handled directly
          between user and company.
        </li>
        <li>
          💼 GTL only earns revenue from <strong>search access</strong> – we are
          not a financial intermediary.
        </li>
      </ul>
      <p>
        This model ensures <strong>legal and regulatory safety</strong>, removes
        any liability as a payment handler, and provides a
        <strong> sustainable B2B SaaS revenue model</strong>.
      </p>
    </div>
  );
};

export default HowItWorks;
