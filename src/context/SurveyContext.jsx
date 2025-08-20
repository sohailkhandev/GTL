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
} from "../utils/database.utils";
import { useAppContext } from "./AppContext";

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

  const fetchSurveys = useCallback(async () => {
    try {
      setIsLoadingSurveys(true);

      // Use your database utility function directly
      const { documents: fetchedSurveys } = await getAllDocuments({
        collectionName: "surveys",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setSurveys(fetchedSurveys);
      setIsLoadingSurveys(false);
      setFetchSurveysError(null);
    } catch (error) {
      setIsLoadingSurveys(false);
      setFetchSurveysError(error);
      console.error("Error fetching surveys:", error);
    }
  }, []);

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

  // Only fetch surveys when user is authenticated
  useEffect(() => {
    if (user) {
      // User is logged in, fetch surveys
      fetchSurveys();
    } else {
      // User is not logged in, clear surveys and reset state
      setSurveys([]);
      setIsLoadingSurveys(false);
      setFetchSurveysError(null);
    }
  }, [user, fetchSurveys]);

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
  };

  return (
    <SurveyContext.Provider value={contextValue}>
      {children}
    </SurveyContext.Provider>
  );
};
