// Check email component will show when user create account and verification email is sent

import React from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaRedoAlt, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/config/Firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const CheckEmail = ({ email, password }) => {
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    try {
      // Since the user is logged out after registration, we need to sign them in temporarily
      // to resend the verification email, then immediately sign them out
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Send verification email to the user
      await sendEmailVerification(userCredential.user, {
        url: `${window.location.origin}/verifyemail`,
      });

      toast.success("Verification email resent successfully!");
      console.log("Resending verification email to:", email);

      // Immediately sign out the user to prevent header from appearing
      await auth.signOut();
    } catch (error) {
      console.error("Error resending verification email:", error);
      toast.error(error.message || "Failed to resend verification email");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <FaEnvelope className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Check Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification link to your email
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResendEmail}
              className="w-full flex justify-center items-center py-2 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaRedoAlt className="mr-2" />
              Resend Verification Email
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaArrowLeft className="mr-2" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckEmail;
