import React, { useState, useEffect } from "react";
import { addDocument, updateDocument } from "@/utils/database.utils";
import { updateJackpotOnSurveyCompletion } from "@/services/jackpotService";
import { useAppContext } from "@/context/AppContext";

const AdminSurvey = ({ onComplete, user }) => {
  const [currentSurvey, setCurrentSurvey] = useState(1);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refreshUserData } = useAppContext();

  // Survey 1: Basic demographics (4 items)
  const survey1 = {
    id: "admin-survey-1",
    title: "Basic Demographics Survey",
    description:
      "Please complete this survey to continue with your membership upgrade.",
    questions: [
      {
        id: "gender",
        text: "What is your gender?",
        type: "multiple_choice",
        options: ["Male", "Female", "Other", "Prefer not to say"],
        required: true,
      },
      {
        id: "ageGroup",
        text: "What is your age group?",
        type: "multiple_choice",
        options: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
        required: true,
      },
      {
        id: "ethnicity",
        text: "What is your ethnic background?",
        type: "multiple_choice",
        options: [
          "White/Caucasian",
          "Black/African American",
          "Hispanic/Latino",
          "Asian",
          "Native American",
          "Pacific Islander",
          "Mixed",
          "Other",
          "Prefer not to say",
        ],
        required: true,
      },
      {
        id: "country",
        text: "What is your country of residence?",
        type: "text",
        required: true,
      },
    ],
  };

  // Survey 2: Extended profile (10 items based on Excel reference)
  const survey2 = {
    id: "admin-survey-2",
    title: "Extended Profile Survey",
    description:
      "Please complete this survey to finalize your membership upgrade.",
    questions: [
      {
        id: "education",
        text: "What is your highest level of education?",
        type: "multiple_choice",
        options: [
          "High School",
          "Some College",
          "Associate's Degree",
          "Bachelor's Degree",
          "Master's Degree",
          "Doctorate",
          "Other",
        ],
        required: true,
      },
      {
        id: "employment",
        text: "What is your current employment status?",
        type: "multiple_choice",
        options: [
          "Employed Full-time",
          "Employed Part-time",
          "Self-employed",
          "Student",
          "Retired",
          "Unemployed",
          "Other",
        ],
        required: true,
      },
      {
        id: "income",
        text: "What is your annual household income range?",
        type: "multiple_choice",
        options: [
          "Under $25,000",
          "$25,000 - $49,999",
          "$50,000 - $74,999",
          "$75,000 - $99,999",
          "$100,000 - $149,999",
          "$150,000 - $199,999",
          "$200,000+",
          "Prefer not to say",
        ],
        required: true,
      },
      {
        id: "maritalStatus",
        text: "What is your marital status?",
        type: "multiple_choice",
        options: [
          "Single",
          "Married",
          "Divorced",
          "Widowed",
          "Separated",
          "In a relationship",
          "Other",
        ],
        required: true,
      },
      {
        id: "children",
        text: "Do you have children?",
        type: "multiple_choice",
        options: ["Yes", "No", "Prefer not to say"],
        required: true,
      },
      {
        id: "healthStatus",
        text: "How would you describe your general health?",
        type: "multiple_choice",
        options: ["Excellent", "Very Good", "Good", "Fair", "Poor"],
        required: true,
      },
      {
        id: "exercise",
        text: "How often do you exercise?",
        type: "multiple_choice",
        options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
        required: true,
      },
      {
        id: "smoking",
        text: "Do you smoke?",
        type: "multiple_choice",
        options: [
          "Never smoked",
          "Former smoker",
          "Current smoker",
          "Occasional smoker",
        ],
        required: true,
      },
      {
        id: "alcohol",
        text: "How often do you consume alcohol?",
        type: "multiple_choice",
        options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
        required: true,
      },
      {
        id: "diet",
        text: "How would you describe your diet?",
        type: "multiple_choice",
        options: [
          "Very healthy",
          "Somewhat healthy",
          "Neutral",
          "Somewhat unhealthy",
          "Very unhealthy",
        ],
        required: true,
      },
    ],
  };

  const currentSurveyData = currentSurvey === 1 ? survey1 : survey2;

  const handleAnswerChange = (questionId, value) => {
    console.log(`Answer changed for question ${questionId}:`, value);
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: value,
      };
      console.log("Updated answers:", newAnswers);
      return newAnswers;
    });
  };

  const allQuestionsAnswered = () => {
    const result = currentSurveyData.questions.every((question) => {
      if (!question.required) return true;
      const answer = answers[question.id];
      const isValid = answer !== undefined && answer !== null && answer !== "";
      console.log(
        `Question ${question.id}: ${question.text} - Answer: "${answer}" - Valid: ${isValid}`
      );
      return isValid;
    });
    console.log("All questions answered result:", result);
    return result;
  };

  const submitSurvey = async () => {
    console.log("Submit survey called");
    console.log("Current survey:", currentSurvey);
    console.log("Answers:", answers);
    console.log("All questions answered:", allQuestionsAnswered());

    if (!allQuestionsAnswered()) {
      alert("Please answer all required questions.");
      return;
    }

    setLoading(true);

    try {
      // Save survey response to user's survey history
      const surveyResponse = {
        userId: user.uid,
        surveyId: currentSurveyData.id,
        surveyTitle: currentSurveyData.title,
        surveyType: "admin-survey",
        answers: answers,
        submittedAt: new Date().toISOString(),
        status: "completed",
      };

      console.log("Submitting survey response:", surveyResponse);

      await addDocument({
        collectionName: "surveySubmissions",
        data: surveyResponse,
      });

      console.log("Survey response saved successfully");

      // Update Progressive Rewards when admin survey is completed
      try {
        await updateJackpotOnSurveyCompletion();
        console.log("Progressive Rewards updated for admin survey completion");
      } catch (progressiveRewardError) {
        console.error(
          "Error updating Progressive Rewards:",
          progressiveRewardError
        );
      }

      // If this is survey 2, update user membership status
      if (currentSurvey === 2) {
        console.log("Updating user membership to full member");
        await updateDocument({
          collectionName: "users",
          documentId: user.uid,
          data: {
            member: "full member",
            membershipUpgradedAt: new Date().toISOString(),
          },
        });

        setSubmitted(true);
        setTimeout(async () => {
          // Refresh user data to get updated member status
          await refreshUserData();
          onComplete(); // Notify parent component
        }, 2000);
      } else {
        console.log("Moving to survey 2");
        // Move to survey 2
        setCurrentSurvey(2);
        setAnswers({});
      }
    } catch (error) {
      console.error("Error submitting survey:", error);
      alert("Failed to submit survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <h2 className="font-bold text-xl mb-2">🎉 Congratulations!</h2>
          <p>You have successfully completed both membership surveys.</p>
          <p className="mt-2 font-medium">
            Your account has been upgraded to Full Member status!
          </p>
        </div>
        <p className="text-gray-600">
          You can now participate in regular surveys and earn rewards.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Membership Upgrade
          </h2>
          <span className="text-sm text-gray-600">
            Survey {currentSurvey} of 2
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#2069BA] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentSurvey / 2) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Survey Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-2">
          {currentSurveyData.title}
        </h3>
        <p className="text-gray-600 mb-6">{currentSurveyData.description}</p>

        <div className="space-y-6">
          {currentSurveyData.questions.map((question) => (
            <div key={question.id} className="border-b border-gray-100 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {question.text}
                {question.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>

              {question.type === "text" && (
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#2069BA] focus:border-[#2069BA] transition-colors"
                  value={answers[question.id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(question.id, e.target.value)
                  }
                  required={question.required}
                />
              )}

              {question.type === "multiple_choice" && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center">
                      <input
                        type="radio"
                        id={`${question.id}-${option}`}
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="mr-3 h-4 w-4 text-[#2069BA] focus:ring-[#2069BA] border-gray-300"
                        required={question.required}
                      />
                      <label
                        htmlFor={`${question.id}-${option}`}
                        className="text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-between">
          {currentSurvey === 2 && (
            <button
              type="button"
              onClick={() => {
                setCurrentSurvey(1);
                setAnswers({});
              }}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Survey 1
            </button>
          )}

          <button
            type="button"
            onClick={submitSurvey}
            disabled={!allQuestionsAnswered() || loading}
            className="ml-auto bg-[#2069BA] hover:bg-[#1e40af] text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? "Submitting..."
              : currentSurvey === 1
              ? "Continue to Survey 2"
              : "Complete Membership Upgrade"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSurvey;
