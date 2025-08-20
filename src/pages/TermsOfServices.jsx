// terms of services page
const TermsOfService = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
      <p className="mb-4">
        By using GTL, you agree to the following terms that ensure a safe and
        fair data-sharing environment.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">
        1. User Responsibilities
      </h2>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>
          You are responsible for providing accurate and lawful data
          submissions.
        </li>
        <li>You control what information is shared with companies.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-4 mb-2">2. Company Access</h2>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>Companies gain paid search access to anonymized datasets.</li>
        <li>
          Any interaction or reward exchange is handled directly between you and
          the company.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-4 mb-2">3. GTL’s Role</h2>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>GTL does not act as a financial intermediary.</li>
        <li>We earn revenue solely from granting search access.</li>
        <li>
          We are not liable for transactions or communications outside our
          platform.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-4 mb-2">
        4. Legal & Regulatory Compliance
      </h2>
      <p>
        GTL operates under privacy-focused frameworks and strives to meet all
        applicable data protection regulations to keep your data safe and
        compliant.
      </p>
    </div>
  );
};

export default TermsOfService;
