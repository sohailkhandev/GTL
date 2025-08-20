// verify email page

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { applyActionCode, checkActionCode } from "firebase/auth";
import {
  FaEnvelope,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowRight,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { auth } from "@/config/Firebase";

const VerifyEmail = () => {
  const [status, setStatus] = useState("checking"); // checking, verified, invalid, error
  const [email, setEmail] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const oobCode = queryParams.get("oobCode");

        if (!oobCode) {
          setStatus("invalid");
          return;
        }

        // Check the action code
        const info = await checkActionCode(auth, oobCode);
        setEmail(info.data.email || "");

        // Apply the verification
        await applyActionCode(auth, oobCode);
        setStatus("verified");
        toast.success("Email verified successfully!");

        // Redirect after 3 seconds
        setTimeout(() => navigate("/login"), 3000);
      } catch (error) {
        console.error("Verification error:", error);
        setStatus(
          error.code === "auth/invalid-action-code" ? "invalid" : "error"
        );
        toast.error(error.message || "Verification failed");
      }
    };

    verifyEmail();
  }, [location.search, auth, navigate]);

  const renderContent = () => {
    switch (status) {
      case "checking":
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 animate-pulse">
              <FaEnvelope className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Verifying your email...
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please wait while we verify your email address.
            </p>
          </div>
        );

      case "verified":
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <FaCheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Email Verified!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {email
                ? `Your email ${email} has been verified.`
                : "Your email has been verified."}
            </p>
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              <span>Redirecting to login</span>
              <FaArrowRight className="ml-1.5 h-3 w-3" />
            </div>
          </div>
        );

      case "invalid":
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <FaExclamationCircle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Invalid Link
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This verification link has expired or is invalid.
            </p>
            <button
              onClick={() => navigate("/resend-verification")}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Get New Verification Link
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
              Verification Failed
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              An error occurred during verification.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
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

export default VerifyEmail;
