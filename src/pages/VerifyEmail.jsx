// verify email page

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  applyActionCode,
  checkActionCode,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  FaEnvelope,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowRight,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { auth } from "@/config/Firebase";
import { useAppContext } from "../context/AppContext";

const VerifyEmail = () => {
  const [status, setStatus] = useState("checking"); // checking, verified, invalid, error
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAppContext();

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

        // Automatically sign in the user and redirect to home page
        try {
          // Get the user's password from localStorage (if available) or prompt for it
          const storedPassword = localStorage.getItem(
            `tempPassword_${info.data.email}`
          );

          if (storedPassword) {
            // Auto-login with stored password
            const result = await signIn(info.data.email, storedPassword);
            if (result.success) {
              // Clear the stored password
              localStorage.removeItem(`tempPassword_${info.data.email}`);
              // Redirect to home page
              setTimeout(() => navigate("/"), 2000);
            } else {
              // If auto-login fails, redirect to login page
              setTimeout(() => navigate("/login"), 3000);
            }
          } else {
            // No stored password, show message and redirect to login page
            toast.info("Please log in with your credentials");
            setTimeout(() => navigate("/login"), 3000);
          }
        } catch (error) {
          console.error("Auto-login failed:", error);
          // Redirect to login page if auto-login fails
          setTimeout(() => navigate("/login"), 3000);
        }
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
              <span>Redirecting to home page</span>
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
              onClick={() => navigate("/register")}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Register Again
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
