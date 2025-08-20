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
      id: "points_1000",
      name: "1000 Points",
      description: "Get 1000 search points",
      price: 50,
      priceLabel: "$50",
      points: 1000,
    },
    {
      id: "points_2000",
      name: "2000 Points",
      description: "Get 2000 search points",
      price: 80,
      priceLabel: "$80",
      points: 2000,
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
    if (!selectedPlan || !institution) return;
    const plan = licensePlans.find((p) => p.id === selectedPlan);

    try {
      const createCheckoutSession = httpsCallable(
        functions,
        "createCheckoutSession"
      );
      const response = await createCheckoutSession({
        userId: institution.uid,
        planId: plan.id,
        amount: plan.price,
        domain: window.location.origin,
      });

      if (response.data.success) {
        const stripe = await loadStripe(
          import.meta.env.VITE_REACT_APP_STRIPE_PUBLIC_KEY
        ); // Replace with your publishable key
        await stripe.redirectToCheckout({ sessionId: response.data.id });
      } else {
        alert(response.data.error);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        License & Payments
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ----- Plans Section ----- */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Available Plans
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {licensePlans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <h3 className="text-lg font-medium text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-4 text-2xl font-semibold text-blue-600">
                  {plan.priceLabel}
                </p>
              </div>
            ))}
          </div>

          {selectedPlan && (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Payment
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <button
                  onClick={purchaseLicense}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Pay with Stripe
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ----- Your Licenses Section ----- */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Your Licenses
          </h2>

          {licenses.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <p className="mt-1 text-sm text-gray-500">
                No active licenses. Purchase a plan to get started.
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
