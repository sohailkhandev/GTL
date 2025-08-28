import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../config/Firebase";
import { useAppContext } from "../context/AppContext";

const PrivacyOptOut = () => {
  const { user } = useAppContext();
  const [showInWinnersList, setShowInWinnersList] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load user's current privacy settings
  useEffect(() => {
    const loadPrivacySettings = async () => {
      if (!user?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setShowInWinnersList(userData.showInWinnersList !== false); // Default to true
        }
      } catch (error) {
        console.error("Error loading privacy settings:", error);
      }
    };

    loadPrivacySettings();
  }, [user?.uid]);

  // Save privacy settings
  const handleSaveSettings = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        showInWinnersList: showInWinnersList,
        privacyUpdatedAt: new Date().toISOString(),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      alert("Failed to save privacy settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="text-center text-gray-500">
          <p>Please sign in to manage your privacy settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          🛡️ Privacy Settings
        </h3>
        <p className="text-gray-600">
          Control how your information appears in public areas of the platform.
        </p>
      </div>

      <div className="space-y-6">
        {/* Winners List Visibility */}
        <div className="flex items-start space-x-4">
          <div className="flex items-center h-5">
            <input
              id="showInWinnersList"
              type="checkbox"
              checked={showInWinnersList}
              onChange={(e) => setShowInWinnersList(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="showInWinnersList"
              className="text-sm font-medium text-gray-900"
            >
              Show in Winners List
            </label>
            <p className="text-sm text-gray-500 mt-1">
              When enabled, your masked information (e.g., ji**@g***.com) will
              appear in the public winners list. Your actual email and personal
              details remain private.
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
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
              <h4 className="text-sm font-medium text-blue-800">
                Privacy Protection
              </h4>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  • Your email is always masked (e.g., ji**@g***.com)
                  <br />
                  • Your username is partially hidden (e.g., Joh***)
                  <br />
                  • Your exact location is never shown
                  <br />• You can opt out at any time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>

          {saved && (
            <div className="flex items-center text-green-600">
              <svg
                className="h-5 w-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Settings saved successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyOptOut;
