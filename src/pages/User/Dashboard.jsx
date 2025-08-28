// User Dashboard Page

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/config/Firebase";
import { useAppContext } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { getUserPoints } from "@/services/pointsService";
import ProgressiveJackpot from "../../components/ProgressiveJackpot";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSurveysJoined: 0,
    progressiveRewardsWon: 0,
    pendingClaims: 0,
    pointsEarned: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [payoutsHistory, setPayoutsHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPoints, setCurrentPoints] = useState(0);
  const { user } = useAppContext();

  useEffect(() => {
    if (!user || user.type !== "user") return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch user's survey submissions - same as MyActivity
        let responsesData = [];
        try {
          const submissionsQuery = query(
            collection(db, "surveySubmissions"),
            where("userId", "==", user.uid)
          );
          const submissionsSnapshot = await getDocs(submissionsQuery);
          responsesData = submissionsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("Found survey submissions:", responsesData.length);
        } catch (error) {
          console.error("Error fetching survey submissions:", error);
        }

        // Fetch user's progressive reward wins
        const winsQuery = query(
          collection(db, "jackpotWinners"),
          where("userId", "==", user.uid),
          orderBy("wonAt", "desc")
        );
        const winsSnapshot = await getDocs(winsQuery);
        const winsData = winsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch user's pending claims
        const claimsQuery = query(
          collection(db, "jackpotWinners"),
          where("userId", "==", user.uid),
          where("giftCardDelivered", "==", false),
          orderBy("wonAt", "desc")
        );
        const claimsSnapshot = await getDocs(claimsQuery);
        const claimsData = claimsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate total points earned from survey responses
        const totalPointsEarned = responsesData.length * 20; // 20 points per survey

        // Get current points balance
        const currentPointsBalance = await getUserPoints(user.uid);

        // Set stats
        console.log("Setting stats with:", {
          totalSurveysJoined: responsesData.length,
          progressiveRewardsWon: winsData.length,
          pendingClaims: claimsData.length,
          pointsEarned: totalPointsEarned,
          responsesData: responsesData,
        });

        setStats({
          totalSurveysJoined: responsesData.length,
          progressiveRewardsWon: winsData.length,
          pendingClaims: claimsData.length,
          pointsEarned: totalPointsEarned,
        });

        setCurrentPoints(currentPointsBalance);

        // Set recent activity (last 5 survey responses)
        const activity =
          responsesData.length > 0
            ? responsesData.slice(0, 5).map((response) => ({
                type: "survey_completed",
                date: response.date || new Date().toISOString(),
                details: `Completed survey and earned 20 points`,
                surveyId: response.surveyId || response.id,
              }))
            : [];

        console.log("Activity created:", activity.length, "items");

        // Add progressive reward wins to activity
        const recentWins = winsData.slice(0, 3).map((win) => ({
          type: "progressive_reward",
          date: win.wonAt,
          details: `Won ${win.jackpotType} jackpot - $${win.prize} gift card`,
          jackpotType: win.jackpotType,
          prize: win.prize,
        }));

        // Combine and sort activities
        const allActivity = [...activity, ...recentWins]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 8);

        setRecentActivity(allActivity);

        // Set payouts history
        setPayoutsHistory(winsData);

        // For now, set empty favorites (can be implemented later)
        setFavorites([]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "survey_completed":
        return (
          <div className="flex-shrink-0 bg-green-500 rounded-full p-2">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case "progressive_reward":
        return (
          <div className="flex-shrink-0 bg-yellow-500 rounded-full p-2">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 bg-gray-500 rounded-full p-2">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "survey_completed":
        return "text-green-600";
      case "progressive_reward":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  if (!user || user.type !== "user") {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Please login as a user to access the dashboard
          </h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your survey participation and rewards
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Surveys Joined */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Surveys Joined
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.totalSurveysJoined}
                  </div>
                  <Link
                    to="/activity"
                    className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View All
                  </Link>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Progressive Rewards Won */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Progressive Rewards Won
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.progressiveRewardsWon}
                  </div>
                  <Link
                    to="/notifications"
                    className="ml-2 text-sm font-medium text-yellow-600 hover:text-yellow-500"
                  >
                    View All
                  </Link>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Claims */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Pending Claims
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.pendingClaims}
                  </div>
                  <Link
                    to="/notifications"
                    className="ml-2 text-sm font-medium text-orange-600 hover:text-orange-500"
                  >
                    Manage
                  </Link>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Points Earned */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Points Earned
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.pointsEarned.toLocaleString()}
                  </div>
                  <Link
                    to="/activity"
                    className="ml-2 text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    Details
                  </Link>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Points Balance */}
      <div className="lg:col-span-2 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg
                className="mr-2 text-yellow-500 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              Your Current Points Balance
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {currentPoints.toLocaleString()} Points
          </div>
          <p className="text-sm text-gray-600">
            Available for redemption and rewards
          </p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
            <Link
              to="/activity"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View All Activity
            </Link>
          </div>
        </div>
        <div className="bg-white overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <li key={index}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${getActivityColor(
                            activity.type
                          )} truncate`}
                        >
                          {activity.type === "survey_completed"
                            ? "Survey Completed"
                            : "Progressive Reward Won"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {activity.details}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {formatDate(activity.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No recent activity found
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Payouts/Claims History Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Payouts & Claims History
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {payoutsHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prize
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payoutsHistory.map((payout) => (
                    <tr key={payout.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payout.wonAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="capitalize">{payout.jackpotType}</span>{" "}
                        Jackpot
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${payout.prize} Gift Card
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payout.giftCardDelivered
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payout.giftCardDelivered ? "Delivered" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3">No payouts or claims yet</p>
              <p className="text-sm text-gray-400">
                Complete surveys to have a chance at winning progressive
                rewards!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Favorites Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Favorite Surveys
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {favorites.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">
                      {favorite.title}
                    </h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      Favorite
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {favorite.description || "No description"}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{favorite.questions?.length || 0} questions</span>
                    <span>{favorite.pointsReward || 20} points</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3">No favorite surveys yet</p>
              <p className="text-sm text-gray-400">
                Start participating in surveys and mark your favorites!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quick Actions
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link
                to="/participate"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Participate in Surveys
              </Link>
              <Link
                to="/mypage"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Update Profile
              </Link>
              <Link
                to="/shipping-address"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Manage Shipping Address
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Account Settings
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link
                to="/notifications"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Manage Notifications
              </Link>
              <Link
                to="/activity"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Activity History
              </Link>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                onClick={() => alert("Payout method management coming soon!")}
              >
                Manage Payout Methods
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
