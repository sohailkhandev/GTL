import { httpsCallable } from "firebase/functions";
import { functions } from "../config/Firebase";

// Get all surveys with target count and reward
export const getSurveys = async () => {
  try {
    const getSurveysFunction = httpsCallable(functions, "getSurveys");
    const result = await getSurveysFunction();
    return result.data;
  } catch (error) {
    console.error("Error fetching surveys:", error);
    throw error;
  }
};

// Get survey by ID
export const getSurveyById = async (surveyId) => {
  try {
    const getSurveyByIdFunction = httpsCallable(functions, "getSurveyById");
    const result = await getSurveyByIdFunction({ surveyId });
    return result.data;
  } catch (error) {
    console.error("Error fetching survey:", error);
    throw error;
  }
};

export const submitSurvey = async (surveyData) => {
  try {
    const submitSurveyFunction = httpsCallable(
      functions,
      "submitEncryptedSurvey"
    );
    const result = await submitSurveyFunction(surveyData);
    return result.data;
  } catch (error) {
    console.error("Error submitting survey:", error);
    throw error;
  }
};
