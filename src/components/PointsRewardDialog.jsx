import { useState, useEffect } from "react";

const SurveyPackageDialog = ({ isOpen, onClose, onSubmit, currentPoints }) => {
  const [selectedPackage, setSelectedPackage] = useState("basic");
  const [error, setError] = useState("");

  // Survey packages with different point costs
  const surveyPackages = [
    {
      id: "basic",
      name: "Basic Survey",
      points: 10000,
      description: "Standard research survey",
      color: "bg-blue-50 border-blue-200",
    },
    {
      id: "premium",
      name: "Premium Survey",
      points: 20000,
      description: "In-depth research survey",
      color: "bg-green-50 border-green-200",
    },
    {
      id: "enterprise",
      name: "Enterprise Survey",
      points: 50000,
      description: "Comprehensive research survey",
      color: "bg-purple-50 border-purple-200",
    },
    {
      id: "ultimate",
      name: "Ultimate Survey",
      points: 100000,
      description: "Large-scale research survey",
      color: "bg-red-50 border-red-200",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setSelectedPackage("basic");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedPackage) {
      setError("Please select a survey package.");
      return;
    }

    const packageData = surveyPackages.find(
      (pkg) => pkg.id === selectedPackage
    );
    if (!packageData) {
      setError("Invalid package selected.");
      return;
    }

    // Clear error and submit
    setError("");
    onSubmit(packageData.points);
    onClose();
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Survey Package
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Choose the type of survey you want to create. Points will be
            deducted from your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Package Selection */}
          <div className="space-y-3 mb-6">
            {surveyPackages.map((pkg) => (
              <label
                key={pkg.id}
                className={`block cursor-pointer p-4 border-2 rounded-lg transition-all ${
                  selectedPackage === pkg.id
                    ? `${pkg.color} border-blue-500 ring-2 ring-blue-200`
                    : `${pkg.color} border-gray-200 hover:border-gray-300`
                }`}
              >
                <input
                  type="radio"
                  name="package"
                  value={pkg.id}
                  checked={selectedPackage === pkg.id}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  className="sr-only"
                />
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{pkg.name}</div>
                    <div className="text-sm text-gray-600">
                      {pkg.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">
                      {pkg.points.toLocaleString()} pts
                    </div>
                    <div className="text-sm text-gray-500">{pkg.cost}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Current Points */}
          <div className="mb-6 p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Your Current Balance:</span>
              <span className="font-medium text-gray-900">
                {currentPoints?.toLocaleString() || 0} pts
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Points will be deducted when you create the survey
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Survey
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyPackageDialog;
