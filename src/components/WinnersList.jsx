import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  getDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/Firebase";
import dateUtils from "../utils/date.utils";

const WinnersList = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState("7days");
  const [surveyFilter, setSurveyFilter] = useState("all");
  const [surveys, setSurveys] = useState([]);
  const [debugInfo, setDebugInfo] = useState("");

  // Test Firebase connection
  const testFirebaseConnection = async () => {
    try {
      setDebugInfo("Testing Firebase connection...");

      // Test if we can read from surveyResponses collection
      const testQuery = query(collection(db, "surveyResponses"), limit(1));
      const testSnapshot = await getDocs(testQuery);

      setDebugInfo(
        `Firebase connection successful. Found ${testSnapshot.size} documents in surveyResponses collection.`
      );

      // Test if we can read from users collection
      const usersQuery = query(collection(db, "users"), limit(1));
      const usersSnapshot = await getDocs(usersQuery);

      setDebugInfo(
        (prev) =>
          prev + ` Found ${usersSnapshot.size} documents in users collection.`
      );

      // Test if we can read from surveys collection
      const surveysQuery = query(collection(db, "surveys"), limit(1));
      const surveysSnapshot = await getDocs(surveysQuery);

      setDebugInfo(
        (prev) =>
          prev +
          ` Found ${surveysSnapshot.size} documents in surveys collection.`
      );
    } catch (error) {
      setDebugInfo(`Firebase connection error: ${error.message}`);
      console.error("Firebase test error:", error);
    }
  };

  // Privacy masking function
  const maskUserInfo = (email, username) => {
    if (email) {
      const [localPart, domain] = email.split("@");
      const maskedLocal =
        localPart.length > 2
          ? localPart.substring(0, 2) + "*".repeat(localPart.length - 2)
          : localPart;
      const maskedDomain = domain
        ? domain.substring(0, 1) + "*".repeat(domain.length - 1)
        : "";
      return `${maskedLocal}@${maskedDomain}`;
    }
    if (username) {
      return username.length > 3
        ? username.substring(0, 3) + "*".repeat(username.length - 3)
        : username;
    }
    return "Anonymous";
  };

  // Get time range for filter
  const getTimeRange = useCallback(() => {
    const now = new Date();
    switch (timeFilter) {
      case "today":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "7days":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30days":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  }, [timeFilter]);

  // Fetch winners with real-time updates
  useEffect(() => {
    setLoading(true);
    setError(null);

    const timeRange = getTimeRange();

    let q = query(
      collection(db, "surveyResponses"),
      where("status", "==", "completed"),
      where("timestamp", ">=", timeRange.toISOString()),
      limit(100)
    );

    // Add survey filter if not "all"
    if (surveyFilter !== "all") {
      q = query(q, where("surveyId", "==", surveyFilter));
    }

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          // Get all survey responses
          const allResponses = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort by timestamp in descending order (most recent first)
          allResponses.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );

          // Enrich data with user and survey information
          const enrichedWinners = [];
          for (const response of allResponses) {
            try {
              // Get user information
              const userDoc = await getDoc(doc(db, "users", response.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                // Only include if user hasn't opted out (default to true)
                if (userData.showInWinnersList !== false) {
                  // Get survey information
                  let surveyData = null;
                  if (response.surveyId) {
                    try {
                      const surveyDoc = await getDoc(
                        doc(db, "surveys", response.surveyId)
                      );
                      if (surveyDoc.exists()) {
                        surveyData = surveyDoc.data();
                      }
                    } catch (surveyError) {
                      console.error("Error fetching survey data:", surveyError);
                    }
                  }

                  enrichedWinners.push({
                    ...response,
                    userName: userData.name || userData.username || "Anonymous",
                    userEmail: userData.email || "anonymous@example.com",
                    userCountry: userData.country || "Global",
                    surveyTitle: surveyData?.title || "Survey",
                    surveyType: surveyData?.isBusinessSurvey
                      ? "Business Research"
                      : "Admin Survey",
                    pointsEarned: response.userPointsEarned || 20,
                  });
                }
              } else {
                // If user document doesn't exist, include by default with basic info
                enrichedWinners.push({
                  ...response,
                  userName: "Anonymous",
                  userEmail: "anonymous@example.com",
                  userCountry: "Global",
                  surveyTitle: "Survey",
                  surveyType: "Regular Survey",
                  pointsEarned: response.userPointsEarned || 20,
                });
              }
            } catch (error) {
              console.error("Error enriching winner data:", error);
              // If there's an error, include with basic info for safety
              enrichedWinners.push({
                ...response,
                userName: "Anonymous",
                userEmail: "anonymous@example.com",
                userCountry: "Global",
                surveyTitle: "Survey",
                surveyType: "Regular Survey",
                pointsEarned: response.userPointsEarned || 20,
              });
            }
          }

          console.log("Enriched winners data:", enrichedWinners);
          setWinners(enrichedWinners);
          setLoading(false);
        } catch (error) {
          console.error("Error processing winners:", error);
          setError("Failed to process winners list");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching winners:", error);
        setError(`Failed to load winners list: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [timeFilter, surveyFilter, getTimeRange]);

  // Fetch available surveys for filter
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const surveysQuery = query(collection(db, "surveys"), orderBy("title"));

        const unsubscribe = onSnapshot(surveysQuery, (snapshot) => {
          const surveysData = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              title: doc.data().title,
            }))
            .filter((survey) => {
              const surveyData = snapshot.docs
                .find((doc) => doc.id === survey.id)
                ?.data();
              return (
                surveyData &&
                (surveyData.status === "active" ||
                  surveyData.status === "completed")
              );
            });
          setSurveys(surveysData);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching surveys:", error);
      }
    };

    fetchSurveys();
  }, []);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      // Handle both Firebase Timestamp and regular Date objects
      if (timestamp && timestamp.toDate) {
        return dateUtils.convertFBTimestampToTimeago(timestamp);
      } else if (timestamp) {
        // Convert regular date string to Firebase Timestamp-like object
        const dateObj = new Date(timestamp);
        const mockTimestamp = { toDate: () => dateObj };
        return dateUtils.convertFBTimestampToTimeago(mockTimestamp);
      }
      return "Recently";
    } catch {
      return "Recently";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error Loading Winners</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            🏆 Winners List
          </h2>
          <p className="text-gray-600">
            Recent survey winners and their rewards
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center mt-4 sm:mt-0">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-sm text-green-600 font-medium">
            Live Updates
          </span>
        </div>
      </div>

      {/* Debug section */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700">Debug Information</h4>
          <button
            onClick={testFirebaseConnection}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Test Connection
          </button>
        </div>
        {debugInfo && <p className="text-sm text-gray-600">{debugInfo}</p>}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Time filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Period
          </label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        {/* Survey filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Survey
          </label>
          <select
            value={surveyFilter}
            onChange={(e) => setSurveyFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Surveys</option>
            {surveys.map((survey) => (
              <option key={survey.id} value={survey.id}>
                {survey.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Winners Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Winner
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Reward
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Survey
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Won
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Location
              </th>
            </tr>
          </thead>
          <tbody>
            {winners.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-lg font-medium">
                      No survey completions yet
                    </p>
                    <p className="text-sm">
                      Complete surveys to see your name here! Each survey earns
                      you 20 points.
                    </p>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>How it works:</strong> When you complete a
                        survey, you'll automatically appear here as a "winner"
                        with the points you earned!
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              winners.map((winner) => (
                <tr
                  key={winner.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                        {winner.userName
                          ? winner.userName.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {maskUserInfo(winner.userEmail, winner.userName)}
                        </p>
                        <p className="text-sm text-gray-500">
                          User ID:{" "}
                          {winner.userId
                            ? winner.userId.substring(0, 8) + "..."
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-green-600">
                        {winner.pointsEarned || 20}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">pts</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 truncate">
                        {winner.surveyTitle || "Survey"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {winner.surveyType || "Regular"}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {formatTimestamp(winner.timestamp)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {winner.userCountry || "Global"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View (hidden on desktop) */}
      <div className="sm:hidden mt-6 space-y-4">
        {winners.map((winner) => (
          <div
            key={winner.id}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-2">
                  {winner.userName
                    ? winner.userName.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <span className="font-medium text-gray-900">
                  {maskUserInfo(winner.userEmail, winner.userName)}
                </span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {winner.pointsEarned || 20} pts
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {winner.surveyTitle || "Survey"}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTimestamp(winner.timestamp)}</span>
              <span>{winner.userCountry || "Global"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {winners.length}
            </div>
            <div className="text-sm text-gray-600">Total Winners</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {winners
                .reduce((sum, winner) => sum + (winner.pointsEarned || 20), 0)
                .toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Points Awarded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {surveys.length}
            </div>
            <div className="text-sm text-gray-600">Active Surveys</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnersList;
