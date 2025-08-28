import {
  addDocument,
  updateDocument,
  getDocumentById,
  getDocumentsByFilters,
} from "@/utils/database.utils";
import { addPointsToUser } from "./pointsService";

// Progressive Reward configuration
const JACKPOT_CONFIG = {
  lucky: {
    name: "Lucky",
    giftCardValue: 20, // $20 gift card
    probability: 10000, // 1 in 10,000
    fundingPercentage: 0.5, // 50% of jackpot funding
    failureContribution: 0.05, // $0.05 added on failure
  },
  dream: {
    name: "Dream",
    giftCardValue: 200, // $200 gift card
    probability: 100000, // 1 in 100,000
    fundingPercentage: 0.3, // 30% of jackpot funding
    failureContribution: 0.03, // $0.03 added on failure
  },
  miracle: {
    name: "Miracle",
    giftCardValue: 2000, // $2000 gift card
    probability: 1000000, // 1 in 1,000,000
    fundingPercentage: 0.2, // 20% of jackpot funding
    failureContribution: 0.02, // $0.02 added on failure
  },
};

/**
 * Update progressive reward values when a survey is completed
 */
export const updateJackpotOnSurveyCompletion = async () => {
  try {
    // Each survey response contributes $0.10 to progressive reward
    // Convert survey points to dollars (1 point = $0.01)
    const jackpotContribution = 0.1; // $0.10 per response

    // Update each progressive reward based on their funding percentage
    for (const [key, config] of Object.entries(JACKPOT_CONFIG)) {
      const contribution = jackpotContribution * config.fundingPercentage;

      // Get current progressive reward value
      const jackpotDoc = await getDocumentById({
        collectionName: "jackpots",
        documentId: key,
      });

      const currentPoints = jackpotDoc?.points || 0;
      const newPoints = currentPoints + contribution * 100; // Convert dollars to points

      // Update or create progressive reward document
      if (jackpotDoc) {
        await updateDocument({
          collectionName: "jackpots",
          documentId: key,
          data: { points: newPoints },
        });
      } else {
        await addDocument({
          collectionName: "jackpots",
          data: {
            type: key,
            points: newPoints,
            createdAt: new Date().toISOString(),
          },
        });
      }
    }

    console.log(
      `Progressive reward updated: ${
        jackpotContribution * 100
      } points added from survey completion`
    );
  } catch (error) {
    console.error("Error updating progressive reward:", error);
    throw error; // Re-throw to let calling function handle it
  }
};

/**
 * Process survey completion and update both user points and progressive rewards
 * This is the main function that should be called when a survey is completed
 */
export const processSurveyCompletion = async (
  userId,
  surveyId,
  institutionId = "admin"
) => {
  try {
    // 1. Add points to user (20 points = $0.20)
    const userPointsResult = await addPointsToUser(
      userId,
      20, // 20 points per survey
      "survey_response",
      null,
      surveyId
    );

    if (!userPointsResult.success) {
      throw new Error("Failed to add points to user");
    }

    // 2. Update progressive rewards (10 points = $0.10 contribution)
    await updateJackpotOnSurveyCompletion();

    // 3. Create survey response record
    await addDocument({
      collectionName: "surveyResponses",
      data: {
        userId,
        institutionId,
        surveyId,
        userPointsEarned: 20,
        jackpotContribution: 10,
        adminFee: 20,
        totalCost: 50,
        timestamp: new Date().toISOString(),
        status: "completed",
      },
    });

    console.log(`Survey completion processed successfully for user ${userId}`);
    return {
      success: true,
      userPointsEarned: 20,
      jackpotContribution: 10,
    };
  } catch (error) {
    console.error("Error processing survey completion:", error);
    throw error;
  }
};

/**
 * Check if user wins a jackpot and process the win
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @param {number} userPoints - Current user points
 */
export const checkAndProcessJackpotWin = async (
  userId,
  userEmail,
  userPoints
) => {
  try {
    // Check each jackpot for potential win
    for (const [key, config] of Object.entries(JACKPOT_CONFIG)) {
      // Generate random number to check if user wins
      const randomNumber = Math.floor(Math.random() * config.probability) + 1;

      if (randomNumber === 1) {
        // User wins this progressive reward!
        await processJackpotWin(userId, userEmail, userPoints, key, config);
        return { won: true, jackpotType: key, prize: config.giftCardValue };
      }
    }

    // No win, add failure contributions to progressive rewards
    await addFailureContributions();
    return { won: false };
  } catch (error) {
    console.error("Error checking progressive reward win:", error);
    return { won: false, error: error.message };
  }
};

/**
 * Process a progressive reward win
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @param {number} userPoints - Current user points
 * @param {string} jackpotType - Type of progressive reward won
 * @param {object} config - Progressive reward configuration
 */
const processJackpotWin = async (
  userId,
  userEmail,
  userPoints,
  jackpotType,
  config
) => {
  try {
    // Record the win
    await addDocument({
      collectionName: "jackpotWinners",
      data: {
        userId,
        userEmail,
        jackpotType,
        prize: config.giftCardValue,
        wonAt: new Date().toISOString(),
        giftCardDelivered: false,
      },
    });

    // Add gift card value to user's points
    const giftCardPoints = config.giftCardValue * 100; // Convert dollars to points
    await updateDocument({
      collectionName: "users",
      documentId: userId,
      data: {
        points: userPoints + giftCardPoints,
        lastJackpotWin: {
          type: jackpotType,
          amount: config.giftCardValue,
          wonAt: new Date().toISOString(),
        },
      },
    });

    // Reset the specific progressive reward
    await updateDocument({
      collectionName: "jackpots",
      documentId: jackpotType,
      data: { points: 0 },
    });

    console.log(
      `User ${userEmail} won ${jackpotType} progressive reward: $${config.giftCardValue} gift card`
    );

    // TODO: Send email notification about gift card
    // sendGiftCardEmail(userEmail, config.giftCardValue, jackpotType);
  } catch (error) {
    console.error("Error processing progressive reward win:", error);
    throw error; // Re-throw to let calling function handle it
  }
};

/**
 * Add failure contributions to progressive rewards when no one wins
 */
const addFailureContributions = async () => {
  try {
    for (const [key, config] of Object.entries(JACKPOT_CONFIG)) {
      const failurePoints = config.failureContribution * 100; // Convert dollars to points

      const jackpotDoc = await getDocumentById({
        collectionName: "jackpots",
        documentId: key,
      });

      if (jackpotDoc) {
        const currentPoints = jackpotDoc.points || 0;
        await updateDocument({
          collectionName: "jackpots",
          documentId: key,
          data: { points: currentPoints + failurePoints },
        });
      }
    }

    console.log("Failure contributions added to progressive rewards");
  } catch (error) {
    console.error("Error adding failure contributions:", error);
    throw error; // Re-throw to let calling function handle it
  }
};

/**
 * Handle survey completion and update progressive rewards
 * @param {string} userId - User ID who completed the survey
 * @param {string} userEmail - User email
 * @param {number} surveyPoints - Points earned from the survey
 * @param {number} currentUserPoints - Current user points before survey
 */
export const handleSurveyCompletion = async (
  userId,
  userEmail,
  surveyPoints,
  currentUserPoints
) => {
  try {
    // Update progressive reward values
    await updateJackpotOnSurveyCompletion();

    // Check if user wins a progressive reward
    const jackpotResult = await checkAndProcessJackpotWin(
      userId,
      userEmail,
      currentUserPoints
    );

    // Add survey points to user
    const newUserPoints = currentUserPoints + surveyPoints;

    // Update user points
    await updateDocument({
      collectionName: "users",
      documentId: userId,
      data: {
        points: newUserPoints,
        lastSurveyCompleted: new Date().toISOString(),
      },
    });

    return {
      success: true,
      newPoints: newUserPoints,
      jackpotResult,
    };
  } catch (error) {
    console.error("Error handling survey completion:", error);
    throw error;
  }
};

/**
 * Initialize progressive rewards if they don't exist
 */
export const initializeJackpots = async () => {
  try {
    for (const [key] of Object.entries(JACKPOT_CONFIG)) {
      const jackpotDoc = await getDocumentById({
        collectionName: "jackpots",
        documentId: key,
      });

      if (!jackpotDoc) {
        // Create initial progressive reward document
        await addDocument({
          collectionName: "jackpots",
          data: {
            type: key,
            points: 0,
            createdAt: new Date().toISOString(),
          },
        });
        console.log(`Initialized ${key} progressive reward`);
      }
    }
  } catch (error) {
    console.error("Error initializing progressive rewards:", error);
    throw error;
  }
};

/**
 * Get current progressive reward values
 */
export const getCurrentJackpotValues = async () => {
  try {
    const jackpots = {};

    for (const key of Object.keys(JACKPOT_CONFIG)) {
      const jackpotDoc = await getDocumentById({
        collectionName: "jackpots",
        documentId: key,
      });

      jackpots[key] = {
        points: jackpotDoc?.points || 0,
        config: JACKPOT_CONFIG[key],
      };
    }

    return jackpots;
  } catch (error) {
    console.error("Error getting progressive reward values:", error);
    // Return default values if there's an error
    const defaultJackpots = {};
    for (const key of Object.keys(JACKPOT_CONFIG)) {
      defaultJackpots[key] = {
        points: 0,
        config: JACKPOT_CONFIG[key],
      };
    }
    return defaultJackpots;
  }
};

/**
 * Get recent progressive reward winners
 */
export const getRecentWinners = async (limit = 20) => {
  try {
    // Get recent winners from jackpotWinners collection
    const winners = await getDocumentsByFilters({
      collectionName: "jackpotWinners",
      filters: [],
      limit: limit,
      orderBy: { field: "wonAt", direction: "desc" },
    });

    return winners || [];
  } catch (error) {
    console.error("Error getting recent winners:", error);
    return [];
  }
};

/**
 * Reset all progressive rewards to zero (for testing/admin purposes)
 */
export const resetAllJackpots = async () => {
  try {
    for (const key of Object.keys(JACKPOT_CONFIG)) {
      await updateDocument({
        collectionName: "jackpots",
        documentId: key,
        data: { points: 0 },
      });
    }
    console.log("All progressive rewards reset to zero");
  } catch (error) {
    console.error("Error resetting progressive rewards:", error);
    throw error;
  }
};

/**
 * Test function to simulate survey completion (for development/testing)
 * @param {string} userId - Test user ID
 * @param {string} userEmail - Test user email
 * @param {number} surveyPoints - Points to award
 */
export const testSurveyCompletion = async (
  userId,
  userEmail,
  surveyPoints = 20
) => {
  try {
    console.log(
      `Testing survey completion for ${userEmail} with ${surveyPoints} points`
    );

    // Get current user points
    const userDoc = await getDocumentById({
      collectionName: "users",
      documentId: userId,
    });

    const currentUserPoints = userDoc?.points || 0;
    console.log(`Current user points: ${currentUserPoints}`);

    // Handle survey completion
    const result = await handleSurveyCompletion(
      userId,
      userEmail,
      surveyPoints,
      currentUserPoints
    );

    console.log("Survey completion result:", result);
    return result;
  } catch (error) {
    console.error("Error testing survey completion:", error);
    throw error;
  }
};

/**
 * Get progressive reward statistics
 */
export const getJackpotStats = async () => {
  try {
    const jackpots = await getCurrentJackpotValues();
    const winners = await getRecentWinners(100);

    const stats = {
      totalProgressiveRewardValue: 0,
      totalWinners: winners.length,
      progressiveRewardBreakdown: {},
    };

    for (const [key, jackpot] of Object.entries(jackpots)) {
      const jackpotValue = jackpot.points / 100; // Convert points to dollars
      stats.totalProgressiveRewardValue += jackpotValue;
      stats.progressiveRewardBreakdown[key] = {
        name: JACKPOT_CONFIG[key].name,
        value: jackpotValue,
        points: jackpot.points,
        winners: winners.filter((w) => w.jackpotType === key).length,
      };
    }

    return stats;
  } catch (error) {
    console.error("Error getting progressive reward stats:", error);
    return null;
  }
};

/**
 * Simulate real-time jackpot updates for testing live motion
 * This function can be called periodically to simulate live updates
 */
export const simulateLiveUpdates = async () => {
  try {
    // Get current jackpot values
    const currentValues = await getCurrentJackpotValues();

    // Simulate small increments (like survey responses)
    const updatedValues = {};
    Object.keys(currentValues).forEach((key) => {
      const currentPoints = currentValues[key]?.points || 0;
      // Add random small increment (1-5 points) to simulate live activity
      const increment = Math.floor(Math.random() * 5) + 1;
      updatedValues[key] = {
        ...currentValues[key],
        points: currentPoints + increment,
      };
    });

    // Update the database with new values
    for (const [key, value] of Object.entries(updatedValues)) {
      await updateDocument("jackpots", key, value);
    }

    console.log("Simulated live update completed:", updatedValues);
    return updatedValues;
  } catch (error) {
    console.error("Error simulating live updates:", error);
    throw error;
  }
};

/**
 * Start live update simulation (for testing purposes)
 * @param {number} interval - Update interval in milliseconds (default: 10000ms = 10s)
 */
export const startLiveUpdateSimulation = (interval = 10000) => {
  console.log(`Starting live update simulation every ${interval}ms`);

  const simulationInterval = setInterval(async () => {
    try {
      await simulateLiveUpdates();
    } catch (error) {
      console.error("Live update simulation error:", error);
    }
  }, interval);

  // Return function to stop simulation
  return () => {
    clearInterval(simulationInterval);
    console.log("Live update simulation stopped");
  };
};
