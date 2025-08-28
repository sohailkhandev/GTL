import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  getAllDocuments,
  addDocumentWithId,
  updateDocument,
  getDocumentsByFilters,
} from "../utils/database.utils";
import { useAppContext } from "./AppContext";
import { updateJackpotOnSurveyCompletion } from "../services/jackpotService";

const SurveyContext = createContext({
  // Survey state
  surveys: [],
  currentSurvey: null,
  isLoadingSurveys: true,
  fetchSurveysError: null,

  // Survey actions
  fetchSurveys: () => {},
  setCurrentSurvey: (survey) => {},
  submitSurveyResponse: (data) => {},
  createSurvey: (data) => {},
  updateSurvey: (id, data) => {},

  // Survey submission state
  isSubmittingSurvey: false,
  submitSurveyError: null,

  // Survey selection
  selectedSurveyId: null,
  setSelectedSurveyId: (id) => {},

  // Quota management
  checkAndCloseCompletedSurveys: () => {},
  isCheckingQuotas: false,
});

export const useSurveyContext = () => useContext(SurveyContext);

export const SurveyProvider = ({ children }) => {
  const { user } = useAppContext(); // Get user from AppContext
  const [surveys, setSurveys] = useState([]);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [isLoadingSurveys, setIsLoadingSurveys] = useState(false); // Changed to false initially
  const [fetchSurveysError, setFetchSurveysError] = useState(null);

  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [submitSurveyError, setSubmitSurveyError] = useState(null);

  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [isCheckingQuotas, setIsCheckingQuotas] = useState(false);

  const fetchSurveys = useCallback(async () => {
    try {
      setIsLoadingSurveys(true);

      // Only fetch surveys if user is of type "user"
      if (!user || user.type !== "user") {
        setSurveys([]);
        setIsLoadingSurveys(false);
        return;
      }

      // Use your database utility function directly
      const { documents: fetchedSurveys } = await getAllDocuments({
        collectionName: "surveys",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      // Get user's survey responses to filter out already participated surveys
      let userResponses = [];
      try {
        const response = await getDocumentsByFilters({
          collectionName: "surveyResponses",
          filters: [{ field: "userId", operator: "==", value: user.uid }],
        });
        userResponses = response.documents || [];
      } catch (error) {
        console.warn(
          "Could not fetch user survey responses, showing all surveys:",
          error
        );
        userResponses = [];
      }

      // Create a set of survey IDs the user has already participated in
      const participatedSurveyIds = new Set(
        userResponses
          .map((response) => response.surveyId)
          .filter((surveyId) => surveyId) // Filter out any undefined/null surveyIds
      );

      console.log(
        `User ${user.uid} has participated in ${participatedSurveyIds.size} surveys:`,
        Array.from(participatedSurveyIds)
      );

      // Filter surveys to show only active ones that are available for participation
      // and that the user hasn't already participated in
      const availableSurveys = fetchedSurveys.filter(
        (survey) =>
          survey.status === "active" &&
          survey.participantsCount < survey.targetParticipants &&
          !participatedSurveyIds.has(survey.id)
      );

      console.log(
        `Filtered ${fetchedSurveys.length} total surveys down to ${availableSurveys.length} available surveys for user ${user.uid}`
      );

      setSurveys(availableSurveys);
      setIsLoadingSurveys(false);
      setFetchSurveysError(null);
    } catch (error) {
      setIsLoadingSurveys(false);
      setFetchSurveysError(error);
      console.error("Error fetching surveys:", error);
    }
  }, [user]);

  // Function to check and automatically close surveys that have reached their quota
  const checkAndCloseCompletedSurveys = useCallback(async () => {
    if (surveys.length === 0) return;

    setIsCheckingQuotas(true);
    try {
      let hasUpdates = false;

      for (const survey of surveys) {
        if (
          survey.status === "active" &&
          survey.participantsCount >= survey.targetParticipants
        ) {
          try {
            await updateDocument({
              collectionName: "surveys",
              documentId: survey.id,
              data: {
                status: "completed",
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            });

            // Update Progressive Rewards when survey is automatically completed
            try {
              await updateJackpotOnSurveyCompletion();
              console.log(
                "Progressive Rewards updated for auto-completed survey"
              );
            } catch (progressiveRewardError) {
              console.error(
                "Error updating Progressive Rewards:",
                progressiveRewardError
              );
            }

            hasUpdates = true;
          } catch (error) {
            console.error(`Error updating survey ${survey.id}:`, error);
          }
        }
      }

      // Refresh surveys if any were updated
      if (hasUpdates) {
        await fetchSurveys();
      }
    } catch (error) {
      console.error("Error checking survey quotas:", error);
    } finally {
      setIsCheckingQuotas(false);
    }
  }, [surveys, fetchSurveys]);

  const submitSurveyResponse = async (surveyData) => {
    try {
      setIsSubmittingSurvey(true);
      setSubmitSurveyError(null);

      // For now, just refresh surveys and return success
      // You can implement direct Firestore submission here if needed
      await fetchSurveys();
      return { success: true, message: "Survey submitted successfully" };
    } catch (error) {
      setSubmitSurveyError(error);
      throw error;
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  const createSurvey = async (surveyData) => {
    try {
      const surveyId = await addDocumentWithId({
        collectionName: "surveys",
        data: {
          ...surveyData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        customId: surveyData.id, // Use the survey's ID from the data
      });

      // Refresh surveys after creating new one
      await fetchSurveys();
      return surveyId;
    } catch (error) {
      console.error("Error creating survey:", error);
      throw error;
    }
  };

  const updateSurvey = async (surveyId, surveyData) => {
    try {
      await updateDocument({
        collectionName: "surveys",
        documentId: surveyId,
        data: {
          ...surveyData,
          updatedAt: new Date().toISOString(),
        },
      });

      // Refresh surveys after updating
      await fetchSurveys();
      return true;
    } catch (error) {
      console.error("Error updating survey:", error);
      throw error;
    }
  };

  // Only fetch surveys when user is authenticated and is of type "user"
  useEffect(() => {
    if (user && user.type === "user") {
      // User is logged in and is a regular user, fetch surveys
      fetchSurveys();
    } else {
      // User is not logged in or is not a regular user, clear surveys and reset state
      setSurveys([]);
      setIsLoadingSurveys(false);
      setFetchSurveysError(null);
    }
  }, [user, fetchSurveys]);

  // Set up periodic checking for survey quotas (every 5 minutes)
  useEffect(() => {
    if (surveys.length > 0) {
      const interval = setInterval(() => {
        checkAndCloseCompletedSurveys();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [surveys, checkAndCloseCompletedSurveys]);

  // Check quotas whenever surveys are fetched
  useEffect(() => {
    if (surveys.length > 0) {
      checkAndCloseCompletedSurveys();
    }
  }, [surveys, checkAndCloseCompletedSurveys]);

  const contextValue = {
    // Survey state
    surveys,
    currentSurvey,
    isLoadingSurveys,
    fetchSurveysError,

    // Survey actions
    fetchSurveys,
    setCurrentSurvey,
    submitSurveyResponse,
    createSurvey,
    updateSurvey,

    // Survey submission state
    isSubmittingSurvey,
    submitSurveyError,

    // Survey selection
    selectedSurveyId,
    setSelectedSurveyId,

    // Quota management
    checkAndCloseCompletedSurveys,
    isCheckingQuotas,
  };

  return (
    <SurveyContext.Provider value={contextValue}>
      {children}
    </SurveyContext.Provider>
  );
};
