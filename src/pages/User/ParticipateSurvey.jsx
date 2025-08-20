// this is page from where the user will participate in survey

import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { useSurveyContext } from "../../context/SurveyContext";
import { db, functions } from "@/config/Firebase";
import { collection, query, getDocs, addDoc, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import ReCAPTCHA from "react-google-recaptcha";
import { getSurveys } from "../../services/surveyService";

const ParticipateSurvey = () => {
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [geneticConsentAccepted, setGeneticConsentAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { user } = useAppContext();
  const { surveys, fetchSurveys } = useSurveyContext();
  const recaptchaRef = useRef();

  // Standardized questions based on international regulatory standards
  const standardizedQuestions = [
    {
      id: "std-consent",
      text: "I confirm that I have read and understood the research purpose and compensation conditions",
      description:
        "This includes understanding that the genetic testing kit is provided free of charge and results will be shared",
      type: "checkbox",
      options: ["I confirm"],
      is_required: true,
    },
    {
      id: "std-age",
      text: "What is your age?",
      description: "Must be 18 or older to participate",
      type: "number",
      is_required: true,
    },
    {
      id: "std-gender",
      text: "What is your gender?",
      description: "For research purposes only",
      type: "multiple_choice",
      options: ["Male", "Female", "Other", "Prefer not to say"],
      is_required: true,
    },
    {
      id: "std-ethnicity",
      text: "What is your ethnic background?",
      description: "This helps ensure diverse representation in research",
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
      is_required: true,
    },
    {
      id: "std-medical-history",
      text: "Do you have any known medical conditions?",
      description: "Please select all that apply",
      type: "checkbox",
      options: [
        "Diabetes",
        "Hypertension",
        "Heart Disease",
        "Cancer",
        "Autoimmune Disorders",
        "Mental Health Conditions",
        "None",
        "Other (please specify)",
      ],
      is_required: true,
    },
    {
      id: "std-medications",
      text: "Are you currently taking any medications?",
      description: "This is important for research safety",
      type: "multiple_choice",
      options: [
        "Yes, prescription medications",
        "Yes, over-the-counter medications",
        "Yes, supplements",
        "No medications",
        "Prefer not to say",
      ],
      is_required: true,
    },
    {
      id: "std-genetic-testing",
      text: "Have you had genetic testing before?",
      description: "Previous genetic testing experience",
      type: "multiple_choice",
      options: [
        "Yes, for health reasons",
        "Yes, for ancestry",
        "Yes, for research",
        "No",
        "Unsure",
      ],
      is_required: true,
    },
    {
      id: "std-family-history",
      text: "Do you have a family history of genetic conditions?",
      description: "This helps researchers understand genetic patterns",
      type: "multiple_choice",
      options: [
        "Yes, cancer",
        "Yes, heart disease",
        "Yes, neurological conditions",
        "Yes, other genetic conditions",
        "No known family history",
        "Unsure",
      ],
      is_required: true,
    },
  ];

  // Fetch available surveys using SurveyContext
  useEffect(() => {
    if (user && user.type === "user" && user.isActive) {
      fetchSurveys();
    }
  }, [user, fetchSurveys]);

  const handleSurveySelect = (survey) => {
    setCurrentSurvey(survey);
    setAnswers({});
    setSubmitted(false);
    setRecaptchaToken(null);
    setGeneticConsentAccepted(false);
    setTermsAccepted(false);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const allRequiredQuestionsAnswered = () => {
    if (!currentSurvey) return false;

    // Check standardized questions
    const standardizedRequired = standardizedQuestions.every((question) => {
      if (!question.is_required) return true;
      const answer = answers[question.id];
      if (question.type === "checkbox") {
        return answer && answer.length > 0;
      }
      return answer !== undefined && answer !== null && answer !== "";
    });

    // Check survey-specific questions
    const surveyRequired = currentSurvey.questions.every((question) => {
      if (!question.is_required) return true;
      const answer = answers[question.id];
      if (question.type === "checkbox") {
        return answer && answer.length > 0;
      }
      return answer !== undefined && answer !== null && answer !== "";
    });

    return (
      standardizedRequired &&
      surveyRequired &&
      termsAccepted &&
      geneticConsentAccepted
    );
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
  };

  const handleRecaptchaError = () => {
    setRecaptchaToken(null);
  };

  const submitSurvey = async () => {
    if (!currentSurvey || !user || !recaptchaToken) return;

    try {
      const submitSurvey = httpsCallable(functions, "submitEncryptedSurvey");
      const res = await submitSurvey({
        surveyId: currentSurvey.id,
        userId: user.uid,
        answers,
        recaptchaToken,
        geneticConsentAccepted,
        termsAccepted,
      });

      if (res.data.success) {
        // Create notification for institution if this is an institution survey
        if (currentSurvey.isInstitutionSurvey && currentSurvey.institutionId) {
          try {
            await addDoc(collection(db, "notifications"), {
              userId: currentSurvey.institutionId,
              message: `New survey response received for "${
                currentSurvey.title
              }" from ${user.name || user.email}`,
              type: "survey_response",
              surveyId: currentSurvey.id,
              respondentId: user.uid,
              respondentName: user.name || user.email,
              date: new Date(),
              read: false,
            });
          } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
          }
        }

        setSubmitted(true);
        setRecaptchaToken(null);
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.error("Error submitting survey:", error);
      alert("Failed to submit survey. Please try again.");
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recaptchaToken) {
      alert("Please complete the reCAPTCHA verification");
      return;
    }

    if (!allRequiredQuestionsAnswered()) {
      alert(
        "Please answer all required questions and accept the terms and conditions"
      );
      return;
    }

    await submitSurvey();
  };

  const goback = () => {
    window.location.reload();
  };

  // User type check
  if (!user || user.type !== "user") {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Please login as a user to participate in surveys
        </h2>
      </div>
    );
  }

  // Show if user is inactive
  if (user && !user.isActive) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-red-600">
          Your account is inactive. Please wait until admin approve your
          account.
        </h2>
      </div>
    );
  }

  // Show confirmation message
  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <h2 className="font-bold text-xl mb-2">
            Thank you for your submission!
          </h2>
          <p>Your survey responses have been recorded securely.</p>
          <p className="mt-2 font-medium">
            The company will now have access to your registered information and
            will send the genetic testing kit to your address.
          </p>
        </div>
        <button
          onClick={goback}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Available Surveys
        </button>
      </div>
    );
  }

  // Survey participation form
  if (currentSurvey) {
    return (
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-8">
        <button
          type="button"
          onClick={() => setCurrentSurvey(null)}
          className="mb-6 text-blue-600 hover:underline flex items-center"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to surveys
        </button>

        {/* Company Information Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-blue-600 text-white p-2 rounded-full mr-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-blue-800">
              Company Information
            </h3>
          </div>

          {/* Free Genetic Testing Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="bg-green-500 text-white p-1.5 rounded-full mr-3">
                <svg
                  className="w-4 h-4"
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
              <div>
                <p className="text-green-800 font-semibold text-sm">
                  FREE Genetic Testing Kit Included
                </p>
                <p className="text-green-700 text-xs">
                  Complete genetic testing kit at no cost to you
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded border border-blue-200">
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Company Name
              </label>
              <p className="text-gray-900 font-medium text-sm">
                {currentSurvey.institutionName || "Research Institution"}
              </p>
            </div>

            <div className="bg-white p-3 rounded border border-blue-200">
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Research Purpose
              </label>
              <p className="text-gray-900 text-sm leading-tight">
                {currentSurvey.researchPurpose ||
                  currentSurvey.description ||
                  "Genetic research and analysis for scientific advancement"}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Compensation Conditions
            </label>
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-xs font-medium text-red-600 mb-2 border-b border-red-200 pb-1">
                IMPORTANT: Please read carefully before participating
              </p>
              <ul className="text-xs text-gray-700 space-y-1">
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-1">•</span>
                  <span>
                    <strong>Free Genetic Testing Kit:</strong> Provided
                    completely free of charge
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-1">•</span>
                  <span>
                    <strong>Results Sharing:</strong> Genetic analysis results
                    will be shared with you
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-1">•</span>
                  <span>
                    <strong>No Additional Costs:</strong> No hidden fees or
                    charges
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-1">•</span>
                  <span>
                    <strong>Shipping Included:</strong> Kit shipped to your
                    registered address
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-blue-200">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Sponsorship Amount
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-green-600 bg-green-50 px-2 py-1 rounded border">
                ${currentSurvey.sponsorshipAmount || "80.00"}
              </span>
              <span className="text-xs text-gray-600">(Range: $80 - $999)</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Higher amounts increase participation likelihood
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">{currentSurvey.title}</h2>
        <p className="mb-6 text-gray-600">{currentSurvey.description}</p>

        {/* Standardized Questions Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">
            Standardized Questions (International Regulatory Standards)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            These questions are based on international regulatory standards to
            ensure research compliance and participant safety.
          </p>

          <div className="space-y-6">
            {standardizedQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <div className="mb-2">
                  <h3 className="font-medium">
                    {question.text}
                    {question.is_required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                  {question.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {question.description}
                    </p>
                  )}
                </div>

                {question.type === "text" && (
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    required={question.is_required}
                  />
                )}
                {question.type === "number" && (
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    required={question.is_required}
                    min="18"
                    max="120"
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
                          onChange={() =>
                            handleAnswerChange(question.id, option)
                          }
                          className="mr-2"
                          required={
                            question.is_required && !answers[question.id]
                          }
                        />
                        <label htmlFor={`${question.id}-${option}`}>
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {question.type === "checkbox" && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${question.id}-${option}`}
                          checked={
                            answers[question.id]?.includes(option) || false
                          }
                          onChange={(e) => {
                            const current = answers[question.id] || [];
                            const newValue = e.target.checked
                              ? [...current, option]
                              : current.filter((item) => item !== option);
                            handleAnswerChange(question.id, newValue);
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={`${question.id}-${option}`}>
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Survey-Specific Questions */}
        {currentSurvey.questions && currentSurvey.questions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">
              Additional Research Questions
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              These are additional questions specific to this research study.
            </p>

            <div className="space-y-6">
              {currentSurvey.questions.map((question) => (
                <div
                  key={question.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="mb-2">
                    <h3 className="font-medium">
                      {question.text}
                      {question.is_required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h3>
                    {question.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {question.description}
                      </p>
                    )}
                  </div>

                  {question.type === "text" && (
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded"
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                      required={question.is_required}
                    />
                  )}
                  {question.type === "number" && (
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded"
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                      required={question.is_required}
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
                            onChange={() =>
                              handleAnswerChange(question.id, option)
                            }
                            className="mr-2"
                            required={
                              question.is_required && !answers[question.id]
                            }
                          />
                          <label htmlFor={`${question.id}-${option}`}>
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  {question.type === "dropdown" && (
                    <select
                      className="w-full p-2 border border-gray-300 rounded"
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                      required={question.is_required}
                    >
                      <option value="" disabled>
                        -- Select an option --
                      </option>
                      {question.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {question.type === "checkbox" && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`${question.id}-${option}`}
                            checked={
                              answers[question.id]?.includes(option) || false
                            }
                            onChange={(e) => {
                              const current = answers[question.id] || [];
                              const newValue = e.target.checked
                                ? [...current, option]
                                : current.filter((item) => item !== option);
                              handleAnswerChange(question.id, newValue);
                            }}
                            className="mr-2"
                          />
                          <label htmlFor={`${question.id}-${option}`}>
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms and Conditions Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-yellow-800 mb-4">
            Terms and Conditions
          </h3>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms-acceptance"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <label
                htmlFor="terms-acceptance"
                className="text-sm text-gray-700"
              >
                I confirm that I have answered all survey questions sincerely
                and truthfully. I understand that providing false information
                may affect the research outcomes.
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="genetic-consent"
                checked={geneticConsentAccepted}
                onChange={(e) => setGeneticConsentAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <label
                htmlFor="genetic-consent"
                className="text-sm text-gray-700"
              >
                I agree to provide my genetic information for research purposes
                as described in this survey.
              </label>
            </div>

            <div className="bg-white p-4 rounded border border-yellow-300">
              <p className="text-sm text-gray-800 mb-3">
                <strong>Important:</strong> By accepting these terms, you grant
                the company access to your registered personal information,
                including:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Your email address for communication</li>
                <li>
                  • Your shipping address for receiving the genetic testing kit
                </li>
                <li>• Your survey responses for research analysis</li>
              </ul>
              <p className="text-sm text-gray-800 mt-3">
                The company will send the genetic testing kit directly to your
                registered address.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-5">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_REACT_APP_RECAPCHA_SITE_KEY}
            onChange={handleRecaptchaChange}
            onExpired={handleRecaptchaExpired}
            onErrored={handleRecaptchaError}
          />
        </div>

        <button
          type="submit"
          disabled={!allRequiredQuestionsAnswered() || !recaptchaToken}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:bg-blue-300"
        >
          Submit Survey
        </button>
      </form>
    );
  }

  // Survey list
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">Available Surveys</h2>

      {surveys.length === 0 ? (
        <p className="text-gray-500">
          No surveys available at the moment. Please check back later.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{survey.title}</h3>
                {survey.isInstitutionSurvey && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    {survey.institutionName || "Institution"}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4">{survey.description}</p>

              {/* Company Information Preview */}
              {survey.isInstitutionSurvey && (
                <div className="bg-blue-50 p-3 rounded mb-4">
                  <div className="text-sm text-gray-700">
                    <p>
                      <strong>Company:</strong>{" "}
                      {survey.institutionName || "Research Institution"}
                    </p>
                    {survey.researchPurpose && (
                      <p>
                        <strong>Research:</strong>{" "}
                        {survey.researchPurpose.length > 60
                          ? survey.researchPurpose.substring(0, 60) + "..."
                          : survey.researchPurpose}
                      </p>
                    )}
                    {survey.sponsorshipAmount && (
                      <p>
                        <strong>Sponsorship:</strong> $
                        {survey.sponsorshipAmount}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Target and Reward Information */}
              <div className="flex gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center">
                  <span className="font-medium text-gray-700">Target:</span>
                  <span className="ml-1 text-blue-600 font-semibold">
                    {survey.targetParticipants || 0} participants
                  </span>
                </span>
                <span className="flex items-center">
                  <span className="font-medium text-gray-700">Reward:</span>
                  <span className="ml-1 text-green-600 font-semibold">
                    ${survey.reward || "0.00"}
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {survey.questions ? survey.questions.length + 8 : 8} questions
                  (includes 8 standardized)
                </span>
                <button
                  onClick={() =>
                    !survey.alreadySubmitted && handleSurveySelect(survey)
                  }
                  className={`px-4 py-1 rounded ${
                    survey.alreadySubmitted
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  disabled={survey.alreadySubmitted}
                >
                  {survey.alreadySubmitted
                    ? "Already Submitted"
                    : "Participate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipateSurvey;
