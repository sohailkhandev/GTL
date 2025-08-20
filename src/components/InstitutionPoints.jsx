// Institution points display component

import React, { useState, useEffect } from "react";
import { FaCoins, FaInfoCircle } from "react-icons/fa";
import { getUserPoints, POINT_CONSTANTS } from "../services/pointsService";
import { useAppContext } from "../context/AppContext";

const InstitutionPoints = () => {
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAppContext();

  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const points = await getUserPoints(user.uid);
        setCurrentPoints(points);
      } catch (error) {
        console.error("Error fetching points:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, [user?.uid]);

  const formatPoints = (points) => {
    return points.toLocaleString();
  };

  const formatDollarValue = (points) => {
    return (points * POINT_CONSTANTS.POINT_TO_DOLLAR).toFixed(2);
  };

  const getPointsStatus = () => {
    if (currentPoints >= POINT_CONSTANTS.SURVEY_RESPONSE_COST) {
      return "active";
    } else if (currentPoints > 0) {
      return "low";
    } else {
      return "inactive";
    }
  };

  const getStatusColor = () => {
    const status = getPointsStatus();
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "low":
        return "text-yellow-600 bg-yellow-100";
      case "inactive":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = () => {
    const status = getPointsStatus();
    switch (status) {
      case "active":
        return "Ready to create surveys";
      case "low":
        return "Low balance - purchase more points";
      case "inactive":
        return "No points available";
      default:
        return "Unknown status";
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <FaCoins className="mr-2 text-yellow-500" />
          Your Points Balance
        </h3>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}
        >
          {getStatusText()}
        </span>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {formatPoints(currentPoints)} points
        </div>
        <div className="text-sm text-gray-500">
          ≈ ${formatDollarValue(currentPoints)} USD
        </div>
      </div>

      {currentPoints < POINT_CONSTANTS.SURVEY_RESPONSE_COST && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Action Required:</strong> You need at least{" "}
            {POINT_CONSTANTS.SURVEY_RESPONSE_COST} points to create surveys.
            <a
              href="/institution/licenses"
              className="text-blue-600 hover:text-blue-800 underline ml-1"
            >
              Purchase points now
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionPoints;
