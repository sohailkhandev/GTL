// Points management service for handling user points
// Based on SRS: 1 point = $0.01

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { db } from "@/config/Firebase";

/**
 * Point System Constants (from SRS)
 */
export const POINT_CONSTANTS = {
  POINT_TO_DOLLAR: 0.01, // 1 point = $0.01
  SURVEY_RESPONSE_COST: 50, // 50 points ($0.50) per response
  USER_EARNINGS_PER_RESPONSE: 20, // 20 points ($0.20) per response
  JACKPOT_CONTRIBUTION: 10, // 10 points ($0.10) per response to progressive reward
  ADMIN_FEE: 20, // 20 points ($0.20) per response
  MIN_REDEMPTION: 2000, // 2,000 points minimum for gift card redemption
};

/**
 * Add points to a user's account
 * @param {string} userId - The user's ID
 * @param {number} points - Number of points to add
 * @param {string} source - Source of points (e.g., "purchase", "survey_response", "bonus")
 * @param {string} planId - Plan ID if points are from purchase
 * @param {string} surveyId - Survey ID if points are from survey response
 * @returns {Promise<Object>} - Success status and updated points
 */
export const addPointsToUser = async (
  userId,
  points,
  source = "purchase",
  planId = null,
  surveyId = null
) => {
  try {
    const userRef = doc(db, "users", userId);

    // Get current user data
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const currentPoints = userData.points || 0;
    const newPoints = currentPoints + points;

    // Update user points
    await updateDoc(userRef, {
      points: newPoints,
      lastPointsUpdate: new Date().toISOString(),
    });

    // Create points transaction record
    const transactionRef = doc(
      db,
      "pointTransactions",
      `${userId}_${Date.now()}`
    );
    await setDoc(transactionRef, {
      userId,
      points,
      type: "credit",
      source,
      planId,
      surveyId,
      previousBalance: currentPoints,
      newBalance: newPoints,
      timestamp: new Date().toISOString(),
      description: `Added ${points.toLocaleString()} points from ${source}`,
      dollarValue: (points * POINT_CONSTANTS.POINT_TO_DOLLAR).toFixed(2),
    });

    return {
      success: true,
      previousPoints: currentPoints,
      addedPoints: points,
      newPoints: newPoints,
      dollarValue: (points * POINT_CONSTANTS.POINT_TO_DOLLAR).toFixed(2),
    };
  } catch (error) {
    console.error("Error adding points to user:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Deduct points from company's account for survey responses
 * @param {string} companyId - The company's ID
 * @param {number} responseCount - Number of responses
 * @param {string} surveyId - Survey ID
 * @returns {Promise<Object>} - Success status and remaining points
 */
export const deductSurveyResponsePoints = async (
  companyId,
  responseCount,
  surveyId
) => {
  try {
    const companyRef = doc(db, "users", companyId);

    // Get current company data
    const companyDoc = await getDoc(companyRef);

    if (!companyDoc.exists()) {
      throw new Error("Company not found");
    }

    const companyData = companyDoc.data();
    const currentPoints = companyData.points || 0;
    const totalDeduction = responseCount * POINT_CONSTANTS.SURVEY_RESPONSE_COST;

    if (currentPoints < totalDeduction) {
      throw new Error("Insufficient points for survey responses");
    }

    const remainingPoints = currentPoints - totalDeduction;

    // Update company points
    await updateDoc(companyRef, {
      points: remainingPoints,
      lastPointsUpdate: new Date().toISOString(),
    });

    // Create points transaction record
    const transactionRef = doc(
      db,
      "pointTransactions",
      `${companyId}_${Date.now()}`
    );
    await setDoc(transactionRef, {
      userId: companyId,
      points: totalDeduction,
      type: "debit",
      source: "survey_responses",
      surveyId,
      responseCount,
      previousBalance: currentPoints,
      newBalance: remainingPoints,
      timestamp: new Date().toISOString(),
      description: `Deducted ${totalDeduction.toLocaleString()} points for ${responseCount} survey responses`,
      dollarValue: (totalDeduction * POINT_CONSTANTS.POINT_TO_DOLLAR).toFixed(
        2
      ),
    });

    return {
      success: true,
      previousPoints: currentPoints,
      deductedPoints: totalDeduction,
      remainingPoints: remainingPoints,
      dollarValue: (totalDeduction * POINT_CONSTANTS.POINT_TO_DOLLAR).toFixed(
        2
      ),
    };
  } catch (error) {
    console.error("Error deducting survey response points:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process survey response and distribute points according to SRS
 * @param {string} userId - User who completed the survey
 * @param {string} companyId - Company that owns the survey
 * @param {string} surveyId - Survey ID
 * @returns {Promise<Object>} - Success status and point distribution
 */
export const processSurveyResponse = async (userId, companyId, surveyId) => {
  try {
    // 1. Add 20 points to user for completing survey
    const userPointsResult = await addPointsToUser(
      userId,
      POINT_CONSTANTS.USER_EARNINGS_PER_RESPONSE,
      "survey_response",
      null,
      surveyId
    );

    if (!userPointsResult.success) {
      throw new Error("Failed to add points to user");
    }

    // 2. Create progressive reward entry (10 points contribution)
    const jackpotEntry = await addDoc(collection(db, "jackpotEntries"), {
      userId,
      surveyId,
      companyId,
      points: POINT_CONSTANTS.JACKPOT_CONTRIBUTION,
      timestamp: new Date().toISOString(),
      status: "pending", // Will be processed by progressive reward system
    });

    // 3. Record the survey response for analytics
    const surveyResponse = await addDoc(collection(db, "surveyResponses"), {
      userId,
      companyId,
      surveyId,
      userPointsEarned: POINT_CONSTANTS.USER_EARNINGS_PER_RESPONSE,
      jackpotContribution: POINT_CONSTANTS.JACKPOT_CONTRIBUTION,
      adminFee: POINT_CONSTANTS.ADMIN_FEE,
      totalCost: POINT_CONSTANTS.SURVEY_RESPONSE_COST,
      timestamp: new Date().toISOString(),
      status: "completed",
    });

    return {
      success: true,
      userPointsEarned: POINT_CONSTANTS.USER_EARNINGS_PER_RESPONSE,
      jackpotContribution: POINT_CONSTANTS.JACKPOT_CONTRIBUTION,
      adminFee: POINT_CONSTANTS.ADMIN_FEE,
      totalCost: POINT_CONSTANTS.SURVEY_RESPONSE_COST,
      jackpotEntryId: jackpotEntry.id,
      surveyResponseId: surveyResponse.id,
    };
  } catch (error) {
    console.error("Error processing survey response:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get user's current points
 * @param {string} userId - The user's ID
 * @returns {Promise<number>} - Current points balance
 */
export const getUserPoints = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return 0;
    }

    const userData = userDoc.data();
    return userData.points || 0;
  } catch (error) {
    console.error("Error getting user points:", error);
    return 0;
  }
};

/**
 * Deduct points from user's account
 * @param {string} userId - The user's ID
 * @param {number} points - Number of points to deduct
 * @param {string} reason - Reason for deduction
 * @returns {Promise<Object>} - Success status and remaining points
 */
export const deductPointsFromUser = async (
  userId,
  points,
  reason = "usage"
) => {
  try {
    const userRef = doc(db, "users", userId);

    // Get current user data
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const currentPoints = userData.points || 0;

    if (currentPoints < points) {
      throw new Error("Insufficient points");
    }

    const remainingPoints = currentPoints - points;

    // Update user points
    await updateDoc(userRef, {
      points: remainingPoints,
      lastPointsUpdate: new Date().toISOString(),
    });

    // Create points transaction record
    const transactionRef = doc(
      db,
      "pointTransactions",
      `${userId}_${Date.now()}`
    );
    await setDoc(transactionRef, {
      userId,
      points,
      type: "debit",
      source: reason,
      previousBalance: currentPoints,
      newBalance: remainingPoints,
      timestamp: new Date().toISOString(),
      description: `Deducted ${points} points for ${reason}`,
      dollarValue: (points * POINT_CONSTANTS.POINT_TO_DOLLAR).toFixed(2),
    });

    return {
      success: true,
      previousPoints: currentPoints,
      deductedPoints: points,
      remainingPoints: remainingPoints,
      dollarValue: (points * POINT_CONSTANTS.POINT_TO_DOLLAR).toFixed(2),
    };
  } catch (error) {
    console.error("Error deducting points from user:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check if user has enough points for redemption
 * @param {string} userId - The user's ID
 * @param {number} requiredPoints - Points required for redemption
 * @returns {Promise<boolean>} - Whether user has enough points
 */
export const hasEnoughPointsForRedemption = async (
  userId,
  requiredPoints = POINT_CONSTANTS.MIN_REDEMPTION
) => {
  try {
    const currentPoints = await getUserPoints(userId);
    return currentPoints >= requiredPoints;
  } catch (error) {
    console.error("Error checking redemption eligibility:", error);
    return false;
  }
};

/**
 * Get user's point transaction history
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - Array of transactions
 */
export const getUserPointTransactions = async (userId) => {
  // This would require a query, but for now we'll return empty array
  // You can implement this later with proper Firestore queries
  console.log("Getting transactions for user:", userId);
  return [];
};
