// payment success page which will get show after user make successful payments

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "@/config/Firebase"; // Adjust import path as needed
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract order ID from URL
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (!orderId) {
      setError("No order ID found in URL");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const orderRef = doc(db, "orders", orderId);

        // First try getting the document immediately
        const docSnap = await getDoc(orderRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
          setLoading(false);
          // If payment is completed, redirect after some time
          if (docSnap.data().status === "completed") {
            setTimeout(() => navigate("/business/dashboard"), 5000);
          }
        } else {
          setError("Order not found");
          setLoading(false);
          return;
        }

        // Then set up the real-time listener
        const unsubscribe = onSnapshot(orderRef, (doc) => {
          if (doc.exists()) {
            setOrder({ id: doc.id, ...doc.data() });
          }
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);
  const renderStatus = () => {
    if (!order) return null;

    switch (order.status) {
      case "completed":
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaCheckCircle className="h-10 w-10 text-green-500" />
              <h2 className="text-2xl font-bold text-green-800">
                Payment Successful!
              </h2>
            </div>
            <p className="text-green-700 mb-4">
              Thank you for your purchase. Your order{" "}
              <span className="font-semibold">{order.id}</span> has been
              processed successfully.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-green-600">
                <span className="font-medium">Amount:</span> $
                {order.amount.toFixed(2)}
              </p>
              <p className="text-sm text-green-600">
                <span className="font-medium">Plan:</span>{" "}
                {order.planId.replace("_", " ")}
              </p>
              <p className="text-sm text-green-600">
                <span className="font-medium">Date:</span>{" "}
                {new Date(order.paidAt?.toDate()).toLocaleString()}
              </p>
            </div>
            <p className="mt-4 text-green-600 text-sm">
              You'll be redirected to your dashboard shortly...
            </p>
          </div>
        );

      case "pending":
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaClock className="h-10 w-10 text-blue-500" />
              <h2 className="text-2xl font-bold text-blue-800">
                Payment Processing
              </h2>
            </div>
            <p className="text-blue-700 mb-4">
              Your order <span className="font-semibold">{order.id}</span> is
              still being processed. Please wait a moment or refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
            >
              Refresh Status
            </button>
          </div>
        );

      case "expired":
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="h-10 w-10 text-yellow-500" />
              <h2 className="text-2xl font-bold text-yellow-800">
                Session Expired
              </h2>
            </div>
            <p className="text-yellow-700 mb-4">
              Your payment session for order{" "}
              <span className="font-semibold">{order.id}</span> has expired.
            </p>
            <button
              onClick={() => navigate("/business/licenses")}
              className="mt-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition"
            >
              Back to Licenses
            </button>
          </div>
        );

      case "failed":
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaTimesCircle className="h-10 w-10 text-red-500" />
              <h2 className="text-2xl font-bold text-red-800">
                Payment Failed
              </h2>
            </div>
            <p className="text-red-700 mb-4">
              We couldn't process your payment for order{" "}
              <span className="font-semibold">{order.id}</span>.
            </p>
            {order.error && (
              <p className="text-sm text-red-600 mb-4">
                <span className="font-medium">Reason:</span> {order.error}
              </p>
            )}
            <button
              onClick={() => navigate("/business/licenses")}
              className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="h-10 w-10 text-gray-500" />
              <h2 className="text-2xl font-bold text-gray-800">
                Unknown Status
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              We couldn't determine the status of your order{" "}
              <span className="font-semibold">{order.id}</span>.
            </p>
            <button
              onClick={() => navigate("/business/licenses")}
              className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              Back to Licenses
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Status</h1>
          <p className="mt-2 text-sm text-gray-600">
            {orderId ? `Order ID: ${orderId}` : "No order ID provided"}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="flex justify-center">
                <FaSpinner className="animate-spin h-12 w-12 text-gray-900" />
              </div>
              <p className="mt-4 text-gray-600">Loading order details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaTimesCircle className="h-10 w-10 text-red-500" />
                <h2 className="text-2xl font-bold text-red-800">Error</h2>
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => navigate("/business/licenses")}
                className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition"
              >
                Back to Licenses
              </button>
            </div>
          ) : (
            renderStatus()
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact our support team at support@yourdomain.com</p>
        </div>
      </div>
    </div>
  );
}
