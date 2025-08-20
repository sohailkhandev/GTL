// this is purchase point page from where institution will purchase the points

import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { loadStripe } from "@stripe/stripe-js";
import { functions } from "@/config/Firebase"; // <-- Your Firebase config file
import { useAppContext } from "@/context/AppContext";

const LicensePayments = () => {
  const [licenses, setLicenses] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { user: institution } = useAppContext();
  const db = getFirestore();

  const licensePlans = [
    {
      id: "points_10000",
      name: "10,000 Points",
      description: "Minimum points required to create surveys as a Company",
      price: 100,
      priceLabel: "$100",
      points: 10000,
      featured: true,
    },
    {
      id: "points_20000",
      name: "20,000 Points",
      description: "Get 20,000 search points for your research",
      price: 200,
      priceLabel: "$200",
      points: 20000,
    },
    {
      id: "points_50000",
      name: "50,000 Points",
      description: "Get 50,000 search points for your research",
      price: 500,
      priceLabel: "$500",
      points: 50000,
    },
    {
      id: "points_100000",
      name: "100,000 Points",
      description: "Get 100,000 search points for your research",
      price: 1000,
      priceLabel: "$1,000",
      points: 100000,
    },
  ];

  // ✅ Fetch user licenses from Firestore
  useEffect(() => {
    const fetchLicenses = async () => {
      if (!institution) return;

      try {
        const q = query(
          collection(db, "licenses"),
          where("institutionId", "==", institution.uid)
        );
        const snapshot = await getDocs(q);
        const fetchedLicenses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLicenses(fetchedLicenses);
      } catch (error) {
        console.error("Error fetching licenses:", error);
      }
    };

    fetchLicenses();
  }, [institution, db]);

  // ✅ Stripe checkout call
  const purchaseLicense = async () => {
    if (!selectedPlan || !institution) {
      console.log("No plan selected or no institution:", {
        selectedPlan,
        institution,
      });
      return;
    }

    const plan = licensePlans.find((p) => p.id === selectedPlan);
    if (!plan) {
      console.error("Plan not found:", selectedPlan);
      alert("Selected plan not found. Please try again.");
      return;
    }

    console.log("Starting purchase for plan:", plan);

    try {
      const createCheckoutSession = httpsCallable(
        functions,
        "createCheckoutSession"
      );

      const requestData = {
        userId: institution.uid,
        planId: plan.id,
        amount: plan.price,
        domain: window.location.origin,
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan_id=${plan.id}&points=${plan.points}&amount=${plan.price}`,
        cancelUrl: `${window.location.origin}/institution/licenses`,
      };

      console.log("Sending request:", requestData);

      const response = await createCheckoutSession(requestData);
      console.log("Response received:", response);

      if (response.data && response.data.success) {
        const stripeKey = import.meta.env.VITE_REACT_APP_STRIPE_PUBLIC_KEY;
        if (!stripeKey) {
          console.error("Stripe public key not found in environment variables");
          alert("Stripe configuration error. Please contact support.");
          return;
        }

        const stripe = await loadStripe(stripeKey);

        if (!stripe) {
          alert("Stripe failed to load. Please check your configuration.");
          return;
        }

        await stripe.redirectToCheckout({ sessionId: response.data.id });
      } else {
        const errorMessage =
          response.data?.error || "Payment failed. Please try again.";
        console.error("Payment failed:", response.data);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error starting Stripe Checkout:", error);
      alert("Failed to start payment session. Please try again.");
    }
  };

  if (!institution || institution.type !== "institution") {
    return <div className="text-center py-8">Institution access required</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Purchase Points</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ----- Plans Section ----- */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Point Packages (required to create and post surveys)
          </h2>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  How Points Work
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    • <strong>10,000 points</strong> is the minimum required to
                    create and post surveys
                  </p>
                  <p>
                    • Points are used to access research participants and survey
                    tools
                  </p>
                  <p>
                    • Higher point packages provide better value for research
                    institutions
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {licensePlans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 cursor-pointer transition-all relative ${
                  selectedPlan === plan.id
                    ? "border-blue-500 bg-blue-50"
                    : plan.featured
                    ? "border-green-500 bg-green-50 hover:border-green-400 hover:shadow-lg"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <h3
                  className={`text-lg font-medium ${
                    plan.featured ? "text-green-900" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-1 text-sm ${
                    plan.featured ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {plan.description}
                </p>
                <p
                  className={`mt-4 text-2xl font-semibold ${
                    plan.featured ? "text-green-600" : "text-blue-600"
                  }`}
                >
                  {plan.priceLabel}
                </p>
              </div>
            ))}
          </div>

          {selectedPlan && (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Purchase{" "}
                  {licensePlans.find((p) => p.id === selectedPlan)?.name}
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <button
                  onClick={purchaseLicense}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Purchase{" "}
                  {licensePlans.find((p) => p.id === selectedPlan)?.name} -{" "}
                  {licensePlans.find((p) => p.id === selectedPlan)?.priceLabel}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ----- Your Licenses Section ----- */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Your Point Packages
          </h2>

          {licenses.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <p className="mt-1 text-sm text-gray-500">
                No point packages purchased yet. Purchase a package to get
                started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {licenses.map((license) => {
                const plan =
                  licensePlans.find((p) => p.id === license.planId) || {};
                return (
                  <div
                    key={license.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        {plan.name || "Unknown Plan"}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          license.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {license.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {plan.description || "No description available"}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Purchased:</p>
                        <p>
                          {new Date(license.purchaseDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {plan.points ? `${plan.points} points` : "N/A"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LicensePayments;
