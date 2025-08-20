// Institution Survey Builder - allows institutions to create surveys for users to participate in

import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useSurveyContext } from "../../context/SurveyContext";
import { db } from "@/config/Firebase";
import { collection, getDocs } from "firebase/firestore";

const InstitutionSurveyBuilder = () => {
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    description: "",
    type: "text",
    options: [],
    is_required: false,
  });
  const [tempOption, setTempOption] = useState("");
  const [surveys, setSurveys] = useState([]);
  const { user } = useAppContext();
  const { createSurvey, updateSurvey } = useSurveyContext();

  // Comprehensive standardized questions based on international regulatory standards
  const standardizedQuestions = [
    // Demographic Information
    {
      text: "What is your gender?",
      description: "For research purposes and demographic analysis",
      type: "multiple_choice",
      options: ["Male", "Female", "Non-binary", "Prefer not to say"],
      is_required: true,
      category: "Demographic Information",
    },
    {
      text: "How old are you?",
      description: "Must be 18 or older to participate",
      type: "multiple_choice",
      options: ["18-29", "30-39", "40-49", "50-59", "60-69", "70+"],
      is_required: true,
      category: "Demographic Information",
    },
    {
      text: "What is your height?",
      description: "Height in centimeters for research analysis",
      type: "number",
      is_required: true,
      category: "Demographic Information",
    },
    {
      text: "What is your weight?",
      description: "Weight in kilograms for research analysis",
      type: "number",
      is_required: true,
      category: "Demographic Information",
    },
    {
      text: "What is your ethnicity/race?",
      description: "This helps ensure diverse representation in research",
      type: "multiple_choice",
      options: [
        "Asian",
        "Black or African",
        "White",
        "Hispanic or Latino",
        "Middle Eastern",
        "Mixed",
        "Other",
      ],
      is_required: true,
      category: "Demographic Information",
    },
    {
      text: "Which country/region do you live in?",
      description: "Geographic location for research analysis",
      type: "multiple_choice",
      options: [
        "United States",
        "Canada",
        "United Kingdom",
        "Germany",
        "France",
        "Australia",
        "Japan",
        "Korea",
        "China",
        "India",
        "Other",
      ],
      is_required: true,
      category: "Demographic Information",
    },

    // Medical History
    {
      text: "Do you have any current diagnosed conditions?",
      description: "Please select all that apply",
      type: "checkbox",
      options: [
        "No conditions",
        "Diabetes",
        "Hypertension",
        "Cardiovascular Disease",
        "Cancer",
        "Respiratory Disease",
        "Other",
      ],
      is_required: true,
      category: "Medical History",
    },
    {
      text: "Have you had any major illnesses or surgeries in the past?",
      description: "Please select all that apply",
      type: "checkbox",
      options: [
        "No",
        "Appendectomy",
        "Heart Surgery",
        "Orthopedic Surgery",
        "Other",
      ],
      is_required: true,
      category: "Medical History",
    },
    {
      text: "Does anyone in your family have a history of serious disease?",
      description: "Please select all that apply",
      type: "checkbox",
      options: [
        "No",
        "Diabetes",
        "Cancer",
        "Cardiovascular Disease",
        "Neurological Disorder",
        "Other",
      ],
      is_required: true,
      category: "Medical History",
    },
    {
      text: "Do you have any allergies (medicine, food, environmental)?",
      description: "Please select all that apply",
      type: "checkbox",
      options: [
        "No",
        "Penicillin",
        "Food Allergy",
        "Seasonal Allergy",
        "Other",
      ],
      is_required: true,
      category: "Medical History",
    },
    {
      text: "Have you ever been hospitalized before?",
      description: "Previous hospitalization history",
      type: "multiple_choice",
      options: ["Never", "Once", "More than once"],
      is_required: true,
      category: "Medical History",
    },

    // Medication and Treatment History
    {
      text: "Are you currently taking any medications?",
      description: "Please select all that apply",
      type: "checkbox",
      options: [
        "No",
        "Yes - Prescription drugs",
        "Yes - Over-the-counter drugs",
        "Yes - Supplements",
      ],
      is_required: true,
      category: "Medication and Treatment History",
    },
    {
      text: "Have you taken important medicines in the past?",
      description: "Please select all that apply",
      type: "checkbox",
      options: ["No", "Antibiotics", "Painkillers", "Antidepressants", "Other"],
      is_required: true,
      category: "Medication and Treatment History",
    },
    {
      text: "Have you ever had an adverse reaction to a medicine?",
      description: "Previous adverse drug reactions",
      type: "multiple_choice",
      options: ["No", "Mild reaction", "Severe reaction"],
      is_required: true,
      category: "Medication and Treatment History",
    },
    {
      text: "Have you ever participated in a clinical trial before?",
      description: "Previous clinical trial participation",
      type: "multiple_choice",
      options: ["No", "Yes, within 1 year", "Yes, more than 1 year ago"],
      is_required: true,
      category: "Medication and Treatment History",
    },

    // Lifestyle and Environmental Factors
    {
      text: "Do you smoke?",
      description: "Current smoking status",
      type: "multiple_choice",
      options: ["Never", "Occasionally", "Regularly", "Daily"],
      is_required: true,
      category: "Lifestyle and Environmental Factors",
    },
    {
      text: "Do you drink alcohol?",
      description: "Current alcohol consumption",
      type: "multiple_choice",
      options: [
        "Never",
        "Occasionally",
        "1-2 times per week",
        "3-4 times per week",
        "Daily",
      ],
      is_required: true,
      category: "Lifestyle and Environmental Factors",
    },
    {
      text: "How often do you exercise?",
      description: "Regular exercise frequency",
      type: "multiple_choice",
      options: ["Never", "1-2 times a week", "3-4 times a week", "Daily"],
      is_required: true,
      category: "Lifestyle and Environmental Factors",
    },
    {
      text: "How would you describe your diet?",
      description: "Current dietary preferences",
      type: "multiple_choice",
      options: [
        "Balanced",
        "High-fat",
        "High-carb",
        "Vegetarian",
        "Vegan",
        "Gluten-free",
        "Other",
      ],
      is_required: true,
      category: "Lifestyle and Environmental Factors",
    },
    {
      text: "How well do you usually sleep?",
      description: "Sleep quality assessment",
      type: "multiple_choice",
      options: ["Very poor", "Poor", "Average", "Good", "Excellent"],
      is_required: true,
      category: "Lifestyle and Environmental Factors",
    },

    // Genetic and Biological Information
    {
      text: "Has anyone in your family been diagnosed with a genetic disorder?",
      description: "Please select all that apply",
      type: "checkbox",
      options: [
        "No",
        "Yes - Cystic Fibrosis",
        "Yes - Huntington's",
        "Yes - BRCA Mutation",
        "Other",
      ],
      is_required: true,
      category: "Genetic and Biological Information",
    },
    {
      text: "Have you ever had a genetic test before?",
      description: "Previous genetic testing experience",
      type: "multiple_choice",
      options: ["No", "Yes, once", "Yes, multiple times"],
      is_required: true,
      category: "Genetic and Biological Information",
    },
    {
      text: "What is your blood type?",
      description: "Blood type for research purposes",
      type: "multiple_choice",
      options: ["A", "B", "AB", "O", "Unknown"],
      is_required: true,
      category: "Genetic and Biological Information",
    },
    {
      text: "Do you have any rare or chronic diseases?",
      description: "Please select all that apply",
      type: "checkbox",
      options: [
        "No",
        "Yes - Asthma",
        "Yes - Diabetes",
        "Yes - Hypertension",
        "Yes - Other",
      ],
      is_required: true,
      category: "Genetic and Biological Information",
    },

    // Consent and Clinical Trial Conditions
    {
      text: "Do you consent to share your personal and genetic information for research?",
      description: "Required consent for participation",
      type: "multiple_choice",
      options: ["Yes", "No"],
      is_required: true,
      category: "Consent and Clinical Trial Conditions",
    },
    {
      text: "Would you be willing to participate in a clinical trial?",
      description: "Clinical trial participation interest",
      type: "multiple_choice",
      options: ["Yes", "No"],
      is_required: true,
      category: "Consent and Clinical Trial Conditions",
    },
    {
      text: "Can you receive and return a genetic test kit by mail/courier?",
      description: "Logistical capability assessment",
      type: "multiple_choice",
      options: ["Yes", "No"],
      is_required: true,
      category: "Consent and Clinical Trial Conditions",
    },
    {
      text: "How would you like to receive compensation?",
      description: "Compensation preference",
      type: "multiple_choice",
      options: ["Bank transfer", "PayPal", "Gift card", "Check", "Other"],
      is_required: true,
      category: "Consent and Clinical Trial Conditions",
    },
  ];

  // Fetch surveys created by this institution
  useEffect(() => {
    if (user && user.type === "institution") {
      fetchInstitutionSurveys();
    }
  }, [user]);

  const fetchInstitutionSurveys = async () => {
    try {
      const surveysQuery = collection(db, "surveys");
      const snapshot = await getDocs(surveysQuery);
      const institutionSurveys = [];

      snapshot.forEach((doc) => {
        const survey = doc.data();
        if (survey.institutionId === user.uid) {
          institutionSurveys.push({
            id: doc.id,
            ...survey,
          });
        }
      });

      // Sort by creation date (newest first)
      institutionSurveys.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setSurveys(institutionSurveys);
    } catch (error) {
      console.error("Error fetching institution surveys:", error);
    }
  };

  // Create a new survey
  const handleCreateNewSurvey = () => {
    const newSurvey = {
      id: `survey-${Date.now()}`,
      title: "New Health Survey",
      description:
        "Please answer these health-related questions to help researchers find suitable studies for you.",
      researchPurpose:
        "This research aims to advance our understanding of genetic factors in health and disease. By analyzing genetic data alongside health information, we hope to identify patterns that could lead to improved medical treatments, personalized healthcare approaches, and better understanding of disease prevention strategies.",
      sponsorshipAmount: "80.00",
      targetParticipants: 100,
      reward: "5.00",
      questions: [
        ...standardizedQuestions.map((q, i) => ({
          ...q,
          id: `std-q-${i}`,
        })),
      ],
      createdAt: new Date().toISOString(),
      institutionId: user.uid,
      institutionName: user.name || user.institutionName,
      status: "active",
      participantsCount: 0,
      isInstitutionSurvey: true,
    };
    setEditingSurvey(newSurvey);
  };

  // Save survey
  const handleSaveSurvey = async () => {
    if (!editingSurvey) return;
    try {
      // Check if this survey already exists
      const existingSurvey = surveys.find((s) => s.id === editingSurvey.id);

      if (existingSurvey) {
        // Update existing survey
        await updateSurvey(editingSurvey.id, editingSurvey);
      } else {
        // Create new survey
        await createSurvey(editingSurvey);
      }
      setEditingSurvey(null);
      fetchInstitutionSurveys(); // Refresh the list
    } catch (error) {
      console.error("Error saving survey:", error);
    }
  };

  // Add a new question
  const handleAddQuestion = () => {
    if (!editingSurvey || !newQuestion.text) return;

    const question = {
      id: `q-${Date.now()}`,
      text: newQuestion.text,
      description: newQuestion.description,
      type: newQuestion.type,
      is_required: newQuestion.is_required,
      ...(newQuestion.type !== "text" && { options: newQuestion.options }),
    };

    setEditingSurvey((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }));

    setNewQuestion({
      text: "",
      description: "",
      type: "text",
      options: [],
      is_required: false,
    });
  };

  const handleAddOption = () => {
    if (!tempOption) return;
    setNewQuestion((prev) => ({
      ...prev,
      options: [...prev.options, tempOption],
    }));
    setTempOption("");
  };

  const handleRemoveOption = (index) => {
    setNewQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveQuestion = (questionId) => {
    setEditingSurvey((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  };

  const addStandardizedQuestions = () => {
    if (!editingSurvey) return;

    const newQuestions = [
      ...standardizedQuestions.map((q, i) => ({
        ...q,
        id: `std-q-${Date.now()}-${i}`,
      })),
    ];

    setEditingSurvey((prev) => ({
      ...prev,
      questions: [...prev.questions, ...newQuestions],
    }));
  };

  const toggleSurveyStatus = async (surveyId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      await updateSurvey(surveyId, { status: newStatus });
      fetchInstitutionSurveys(); // Refresh the list
    } catch (error) {
      console.error("Error updating survey status:", error);
    }
  };

  if (!user || user.type !== "institution") {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Institution access required
        </h2>
        <p>Please login with an institution account to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">Survey Builder</h2>

      {!editingSurvey ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Your Surveys</h3>
            <div className="space-x-2">
              <button
                onClick={handleCreateNewSurvey}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Create New Survey
              </button>
            </div>
          </div>

          {surveys.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-500">No surveys created yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first survey to start collecting genetic research
                data from users.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-xl font-semibold mb-2">
                        {survey.title}
                      </h4>
                      <p className="text-gray-600 mb-4">
                        {survey.description || "No description"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          survey.status === "active"
                            ? "bg-green-100 text-green-800"
                            : survey.status === "paused"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {survey.status || "active"}
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Institution
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center">
                        <span className="font-medium">Target:</span>{" "}
                        {survey.targetParticipants || 0} participants
                      </span>
                      <span className="flex items-center">
                        <span className="font-medium">Reward:</span> $
                        {survey.reward || "0.00"}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center">
                        <span className="font-medium">Current:</span>{" "}
                        {survey.participantsCount || 0} participants
                      </span>
                      <span className="flex items-center">
                        <span className="font-medium">Questions:</span>{" "}
                        {survey.questions?.length || 0} +{" "}
                        {standardizedQuestions.length} standardized
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() =>
                        toggleSurveyStatus(survey.id, survey.status)
                      }
                      className={`px-3 py-1 rounded text-sm ${
                        survey.status === "active"
                          ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {survey.status === "active" ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={() => setEditingSurvey(survey)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Editing Survey</h3>
            <div className="space-x-2">
              <button
                onClick={() => setEditingSurvey(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSurvey}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                Save Survey
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Survey Title
            </label>
            <input
              type="text"
              value={editingSurvey.title}
              onChange={(e) =>
                setEditingSurvey((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editingSurvey.description}
              onChange={(e) =>
                setEditingSurvey((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full p-2 border border-gray-300 rounded mb-4"
              rows="3"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Research Purpose
            </label>
            <textarea
              value={editingSurvey.researchPurpose || ""}
              onChange={(e) =>
                setEditingSurvey((prev) => ({
                  ...prev,
                  researchPurpose: e.target.value,
                }))
              }
              className="w-full p-2 border border-gray-300 rounded mb-4"
              rows="3"
              placeholder="Describe the specific research purpose and goals..."
            />

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Participants
                </label>
                <input
                  type="number"
                  value={editingSurvey.targetParticipants || ""}
                  onChange={(e) =>
                    setEditingSurvey((prev) => ({
                      ...prev,
                      targetParticipants: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="100"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reward ($)
                </label>
                <input
                  type="text"
                  value={editingSurvey.reward || ""}
                  onChange={(e) =>
                    setEditingSurvey((prev) => ({
                      ...prev,
                      reward: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="5.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sponsorship Amount ($)
                </label>
                <input
                  type="number"
                  value={editingSurvey.sponsorshipAmount || ""}
                  onChange={(e) =>
                    setEditingSurvey((prev) => ({
                      ...prev,
                      sponsorshipAmount: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="80.00"
                  min="80"
                  max="999"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Range: $80 - $999 (higher amounts increase participation)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium">Questions</h4>
            {editingSurvey.questions.length === 0 && (
              <button
                onClick={addStandardizedQuestions}
                className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-sm"
              >
                Add Standardized Questions
              </button>
            )}
          </div>

          {/* Standardized Questions Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h5 className="font-medium text-blue-800 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
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
              Standardized Questions (Automatically Included)
            </h5>
            <p className="text-sm text-blue-700 mb-3">
              These {standardizedQuestions.length} questions are automatically
              included in every survey based on international regulatory
              standards. Users will answer these questions in addition to any
              custom questions you add below.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {Array.from(
                new Set(standardizedQuestions.map((q) => q.category))
              ).map((category) => (
                <div
                  key={category}
                  className="bg-white p-3 rounded border border-blue-200"
                >
                  <h6 className="font-medium text-blue-800 text-sm mb-2">
                    {category}
                  </h6>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {standardizedQuestions
                      .filter((q) => q.category === category)
                      .map((q, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          <span>{q.text}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> These standardized questions ensure
                research compliance and participant safety. They cannot be
                removed and will always be included in the survey.
              </p>
            </div>
          </div>

          {editingSurvey.questions.length > 0 && (
            <div className="mb-8 space-y-4">
              {editingSurvey.questions.map((question, qIndex) => (
                <div
                  key={question.id}
                  className="bg-gray-50 p-4 rounded border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">
                        {qIndex + 1}. {question.text}
                        {question.is_required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({question.type})
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  {question.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {question.description}
                    </p>
                  )}
                  {question.options && question.options.length > 0 && (
                    <div className="ml-4 mt-2">
                      <ul className="list-disc pl-5 text-sm text-gray-600">
                        {question.options.map((option, oIndex) => (
                          <li key={oIndex}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h5 className="font-medium mb-3">Add New Question</h5>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text *
              </label>
              <input
                type="text"
                value={newQuestion.text}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev,
                    text: e.target.value,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter the question..."
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={newQuestion.description}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Add a description for this question..."
                rows="2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Type
              </label>
              <select
                value={newQuestion.type}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev,
                    type: e.target.value,
                    options: e.target.value === "text" ? [] : prev.options,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="text">Text Input</option>
                <option value="number">Number Input</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="checkbox">Checkbox</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </div>

            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="is_required"
                checked={newQuestion.is_required}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev,
                    is_required: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_required"
                className="ml-2 block text-sm text-gray-700"
              >
                Required question
              </label>
            </div>

            {(newQuestion.type === "multiple_choice" ||
              newQuestion.type === "checkbox" ||
              newQuestion.type === "dropdown") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options
                </label>
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={tempOption}
                    onChange={(e) => setTempOption(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-l"
                    placeholder="Add an option..."
                  />
                  <button
                    onClick={handleAddOption}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-r"
                  >
                    Add
                  </button>
                </div>

                {newQuestion.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className="bg-white px-3 py-1 rounded-full border border-gray-300 flex items-center"
                      >
                        <span>{option}</span>
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleAddQuestion}
              disabled={!newQuestion.text}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:bg-green-300"
            >
              Add Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionSurveyBuilder;
