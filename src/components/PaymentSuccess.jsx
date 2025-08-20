// Payment success component that handles adding points after successful payment

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaSpinner, FaExclamationCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { addPointsToUser } from "../services/pointsService";
import { useAppContext } from "../context/AppContext";

const PaymentSuccess = () => {
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [pointsAdded, setPointsAdded] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAppContext();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // Get payment details from URL parameters
        const queryParams = new URLSearchParams(location.search);
        const sessionId = queryParams.get("session_id");
        const planId = queryParams.get("plan_id");
        const points = parseInt(queryParams.get("points") || "0");
        const amount = parseFloat(queryParams.get("amount") || "0");

        if (!sessionId || !planId || !points || !amount) {
          setErrorMessage("Invalid payment information");
          setStatus("error");
          return;
        }

        if (!user) {
          setErrorMessage("User not authenticated");
          setStatus("error");
          return;
        }

        // Add points to user account
        const result = await addPointsToUser(
          user.uid,
          points,
          "purchase",
          planId
        );

        if (result.success) {
          setPointsAdded(points);
          setStatus("success");

          // Update user context with new points
          if (setUser) {
            setUser((prevUser) => ({
              ...prevUser,
              points: result.newPoints,
            }));
          }

          toast.success(
            `Successfully added ${points.toLocaleString()} points to your account!`
          );

          // Redirect to dashboard after 5 seconds
          setTimeout(() => {
            navigate("/institution/dashboard");
          }, 5000);
        } else {
          setErrorMessage(result.error || "Failed to add points");
          setStatus("error");
        }
      } catch (error) {
        console.error("Error handling payment success:", error);
        setErrorMessage("An unexpected error occurred");
        setStatus("error");
      }
    };

    handlePaymentSuccess();
  }, [location.search, user, setUser, navigate]);

  const renderContent = () => {
    switch (status) {
      case "processing":
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 animate-pulse">
              <FaSpinner className="h-5 w-5 text-blue-600 animate-spin" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Processing Your Payment
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please wait while we add points to your account...
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <FaCheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Payment Successful!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your payment has been processed successfully.
            </p>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>{pointsAdded.toLocaleString()} points</strong> have been
                added to your account.
              </p>
              <p className="text-xs text-green-600 mt-1">
                You can now create surveys and access research tools.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              <span>Redirecting to dashboard in 5 seconds...</span>
            </div>
            <button
              onClick={() => navigate("/institution/dashboard")}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard Now
            </button>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <FaExclamationCircle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Payment Processing Error
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {errorMessage ||
                "An error occurred while processing your payment."}
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/institution/licenses")}
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Purchase Page
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
