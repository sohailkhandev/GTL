import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/config/Firebase";
import { useAppContext } from "../../context/AppContext";
import { useSurveyContext } from "../../context/SurveyContext";
import AdminSurvey from "../../components/AdminSurvey";
import ProgressiveJackpot from "../../components/ProgressiveJackpot";
import { addDocument } from "@/utils/database.utils";
import { processSurveyCompletion } from "../../services/jackpotService";
const STEPS = [
  { id: 1, title: "Intro" },
  { id: 2, title: "Questions" },
  { id: 3, title: "Review" },
  { id: 4, title: "Terms" },
  { id: 5, title: "Submit" },
];

const ParticipateSurvey = () => {
  const { user, refreshUserData } = useAppContext();
  const { surveys, fetchSurveys } = useSurveyContext();

  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [surveyConsentAccepted, setSurveyConsentAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showAdminSurveys, setShowAdminSurveys] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.type !== "user" || !user.isActive) return;
    if (user.member === "not a member") {
      setShowAdminSurveys(true);
    } else {
      setShowAdminSurveys(false);
      fetchSurveys();
    }
  }, [user, fetchSurveys]);

  const handleAdminSurveyComplete = async () => {
    setShowAdminSurveys(false);
    await refreshUserData();
    fetchSurveys();
  };

  const handleSurveySelect = (survey) => {
    setCurrentSurvey(survey);
    setAnswers({});
    setSubmitted(false);
    setSurveyConsentAccepted(false);
    setTermsAccepted(false);
    setCurrentStep(1);
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const allRequiredQuestionsAnswered = useMemo(() => {
    if (!currentSurvey) return false;
    const ok = currentSurvey.questions.every((q) => {
      if (!q.is_required) return true;
      const a = answers[q.id];
      if (q.type === "checkbox") return Array.isArray(a) && a.length > 0;
      return a !== undefined && a !== null && String(a).trim() !== "";
    });
    return ok && termsAccepted && surveyConsentAccepted;
  }, [currentSurvey, answers, termsAccepted, surveyConsentAccepted]);

  const canProceedFromStep = (step) => {
    switch (step) {
      case 1: // Intro - always can proceed
        return true;
      case 2: // Questions - check if ALL questions are answered (both required and optional)
        return (
          currentSurvey &&
          currentSurvey.questions &&
          currentSurvey.questions.every((q) => {
            const a = answers[q.id];
            if (q.type === "checkbox") {
              return a && Array.isArray(a) && a.length > 0;
            }
            if (q.type === "multiple_choice" || q.type === "dropdown") {
              return a !== undefined && a !== null && String(a).trim() !== "";
            }
            return a !== undefined && a !== null && String(a).trim() !== "";
          })
        );
      case 3: // Review - always can proceed
        return true;
      case 4: // Terms - check if terms accepted
        return termsAccepted && surveyConsentAccepted;
      case 5: // Submit - always can proceed
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!canProceedFromStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const submitSurvey = async () => {
    if (!currentSurvey || !user) return;
    setLoading(true);
    try {
      const submitFn = httpsCallable(functions, "submitEncryptedSurvey");
      const res = await submitFn({
        surveyId: currentSurvey.id,
        userId: user.uid,
        answers,
        surveyConsentAccepted,
        termsAccepted,
      });

      if (res?.data?.success) {
        if (currentSurvey.isBusinessSurvey && currentSurvey.institutionId) {
          try {
            await addDocument({
              collectionName: "notifications",
              data: {
                userId: currentSurvey.institutionId,
                message: `New survey response received for "${currentSurvey.title}" from ${user.name}`,
                timestamp: new Date().toISOString(),
                type: "survey_response",
                read: false,
              },
            });
          } catch {}
        }

        try {
          const r = await processSurveyCompletion(
            user.uid,
            currentSurvey.id,
            currentSurvey.institutionId || "admin"
          );
          if (!r?.success) console.error("Failed to process survey completion");
        } catch {}

        setSubmitted(true);
        try {
          await refreshUserData();
        } catch {}
        try {
          await fetchSurveys();
        } catch {}
      } else {
        alert(res?.data?.message || "Submission failed");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRequiredQuestionsAnswered) {
      alert("Please answer all required questions and accept the terms.");
      return;
    }
    await submitSurvey();
  };

  const goback = () => window.location.reload();

  if (!user || user.type !== "user") {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Please login as a user to participate in surveys
        </h2>
      </div>
    );
  }

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

  if (showAdminSurveys) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-800">
              Membership Upgrade Required
            </h3>
          </div>
          <p className="text-blue-700">
            To participate in surveys and earn rewards, you must first complete
            two membership surveys.
          </p>
        </div>
        <AdminSurvey onComplete={handleAdminSurveyComplete} user={user} />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl mb-6 shadow-lg">
          <div className="flex items-center mb-3">
            <div className="bg-green-500 text-white p-2 rounded-full mr-3">
              <svg
                className="w-6 h-6"
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
            <h2 className="font-bold text-2xl">
              Survey Completed Successfully!
            </h2>
          </div>
          <p className="text-lg mb-2">
            Your survey responses have been recorded securely.
          </p>
          <p className="font-medium">
            You've earned{" "}
            <span className="text-green-600 font-bold">
              {currentSurvey?.pointsReward ?? 20} points
            </span>
            .
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={goback}
            className="bg-[#2069BA] hover:bg-[#1e40af] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Back to Available Surveys
          </button>
          <Link
            to="/dashboard"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (currentSurvey) {
    const pct =
      Math.round(
        ((currentSurvey.participantsCount || 0) /
          (currentSurvey.targetParticipants || 1)) *
          100 || 0
      ) || 0;

    return (
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={() => setCurrentSurvey(null)}
            className="text-[#2069BA] hover:text-[#1e40af] hover:underline flex items-center font-semibold transition-colors duration-200"
          >
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to surveys
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Step {currentStep} of {STEPS.length}:{" "}
                {STEPS[currentStep - 1].title}
              </h2>
              <span className="text-sm text-gray-500">
                {STEPS[currentStep - 1].title === "Intro" &&
                  "Survey Overview & Company Info"}
                {STEPS[currentStep - 1].title === "Questions" &&
                  "Answer Survey Questions"}
                {STEPS[currentStep - 1].title === "Review" &&
                  "Review Your Answers"}
                {STEPS[currentStep - 1].title === "Terms" &&
                  "Accept Terms & Conditions"}
                {STEPS[currentStep - 1].title === "Submit" &&
                  "Final Confirmation & Submit"}
              </span>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-[#2069BA] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              ></div>
            </div>

            {/* Step Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {STEPS.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      step.id === currentStep
                        ? "bg-[#2069BA] text-white"
                        : step.id < currentStep
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {step.id}
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-200"
                  >
                    ← Previous
                  </button>
                )}

                {currentStep < STEPS.length ? (
                  <button
                    onClick={nextStep}
                    disabled={!canProceedFromStep(currentStep)}
                    className={`px-4 py-2 rounded-md transition-all duration-200 ${
                      canProceedFromStep(currentStep)
                        ? "bg-[#2069BA] text-white hover:bg-[#1e40af]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={submitSurvey}
                    disabled={!allRequiredQuestionsAnswered || loading}
                    className={`px-4 py-2 rounded-md transition-all duration-200 ${
                      allRequiredQuestionsAnswered && !loading
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {loading ? "Submitting..." : "Submit Survey"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {currentStep === 1 && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-[#2069BA]/10 to-[#1e40af]/10 border border-[#2069BA]/20 rounded-xl p-6 mb-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="bg-[#2069BA] text-white p-3 rounded-xl mr-4 shadow-lg">
                    <svg
                      className="w-6 h-6"
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
                  <div>
                    <h3 className="text-2xl font-bold text-[#2069BA]">
                      {currentSurvey.businessName || "Research Company"}
                    </h3>
                    <p className="text-gray-600">
                      Professional research institution conducting this survey
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Survey Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span className="font-medium text-gray-800">
                          {currentSurvey.title}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium text-gray-800">
                          {currentSurvey.category || "General"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Points Reward:</span>
                        <span className="font-medium text-green-600">
                          {currentSurvey.pointsReward ?? 20} points
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Target Participants:
                        </span>
                        <span className="font-medium text-gray-800">
                          {currentSurvey.targetParticipants || "Unlimited"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Research Purpose
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {currentSurvey.researchPurpose ||
                        "This research aims to gather insights to improve products and services."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Welcome to the Survey!
                </h3>
                <p className="text-gray-600 mb-4">
                  Thank you for participating. Your responses will help us
                  gather valuable insights.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">
                    What to expect:
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Answer questions at your own pace</li>
                    <li>
                      • Earn {currentSurvey.pointsReward ?? 20} points upon
                      completion
                    </li>
                    <li>• Your responses are confidential</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  {currentSurvey.title}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {currentSurvey.description}
                </p>
              </div>

              {currentSurvey.questions?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">
                    Research Questions
                  </h3>
                  <div className="space-y-6">
                    {currentSurvey.questions.map((q) => (
                      <div
                        key={q.id}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                      >
                        <div className="mb-2">
                          <h3 className="font-medium">
                            {q.text}
                            {q.is_required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </h3>
                          {!!q.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {q.description}
                            </p>
                          )}
                        </div>

                        {q.type === "text" && (
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded"
                            value={answers[q.id] || ""}
                            onChange={(e) =>
                              handleAnswerChange(q.id, e.target.value)
                            }
                          />
                        )}

                        {q.type === "number" && (
                          <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded"
                            value={answers[q.id] || ""}
                            onChange={(e) =>
                              handleAnswerChange(q.id, e.target.value)
                            }
                          />
                        )}

                        {q.type === "multiple_choice" && (
                          <div className="space-y-2">
                            {(q.options || []).map((opt) => (
                              <label
                                key={opt}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={opt}
                                  checked={answers[q.id] === opt}
                                  onChange={() => handleAnswerChange(q.id, opt)}
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {q.type === "dropdown" && (
                          <select
                            className="w-full p-2 border border-gray-300 rounded"
                            value={answers[q.id] || ""}
                            onChange={(e) =>
                              handleAnswerChange(q.id, e.target.value)
                            }
                          >
                            <option value="" disabled>
                              -- Select an option --
                            </option>
                            {(q.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {q.type === "checkbox" && (
                          <div className="space-y-2">
                            {(q.options || []).map((opt) => {
                              const arr = Array.isArray(answers[q.id])
                                ? answers[q.id]
                                : [];
                              const checked = arr.includes(opt);
                              return (
                                <label
                                  key={opt}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const curr = Array.isArray(answers[q.id])
                                        ? answers[q.id]
                                        : [];
                                      const next = e.target.checked
                                        ? [...curr, opt]
                                        : curr.filter((x) => x !== opt);
                                      handleAnswerChange(q.id, next);
                                    }}
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {currentStep === 3 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">
                Review Your Answers
              </h3>
              <div className="space-y-3">
                {currentSurvey.questions.map((q) => {
                  const a = answers[q.id];
                  const display = Array.isArray(a)
                    ? a.join(", ")
                    : a !== undefined && a !== null
                    ? String(a)
                    : "—";
                  return (
                    <div key={q.id} className="bg-white p-4 rounded-lg border">
                      <div className="text-sm text-gray-500 mb-1">{q.text}</div>
                      <div className="font-medium text-gray-900">{display}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="bg-yellow-500 text-white p-2 rounded-full mr-3">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-yellow-800">
                  Terms and Conditions
                </h3>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5 text-[#2069BA] focus:ring-[#2069BA] border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I confirm that I have answered all survey questions
                    sincerely and truthfully.
                  </span>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={surveyConsentAccepted}
                    onChange={(e) => setSurveyConsentAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5 text-[#2069BA] focus:ring-[#2069BA] border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to participate and understand my responses will be
                    used for research.
                  </span>
                </label>

                <div className="bg-white p-4 rounded-xl border border-yellow-300 shadow-md">
                  <p className="text-sm text-gray-800 mb-3 font-semibold">
                    Important Information:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Responses may be analyzed in aggregate</li>
                    <li>• Basic demographics for matching</li>
                    <li>• Contact for completion confirmation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Current Participants: {currentSurvey.participantsCount || 0}
                </span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    pct >= 100
                      ? "bg-[#2069BA]"
                      : pct >= 80
                      ? "bg-orange-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              <h1 className="text-2xl mt-6">ReCapcha Comes here </h1>
              <button
                type="submit"
                disabled={!allRequiredQuestionsAnswered || loading}
                className="mt-6 w-full bg-[#2069BA] hover:bg-[#1e40af] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Submitting..." : "Submit Survey"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-lg border font-semibold disabled:opacity-50"
          >
            Back
          </button>
          {currentStep < 5 && (
            <button
              type="button"
              onClick={nextStep}
              className={`px-6 py-2 rounded-lg font-semibold text-white ${
                canProceedFromStep(currentStep)
                  ? "bg-[#2069BA] hover:bg-[#1e40af]"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!canProceedFromStep(currentStep)}
            >
              Next
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-gradient-to-r from-[#2069BA]/10 to-[#1e40af]/10 border border-[#2069BA]/20 rounded-xl p-6 mb-8 shadow-lg">
        <h2 className="text-3xl font-bold text-[#2069BA] mb-3">
          Available Surveys
        </h2>
        <p className="text-gray-600 text-lg">
          Participate in research surveys to earn points and unlock rewards
        </p>
      </div>

      <ProgressiveJackpot />

      {surveys.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
            <p className="text-gray-500 text-lg">
              No surveys available at the moment.
            </p>
            <p className="text-gray-400">
              Please check back later for new opportunities.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {surveys.map((survey) => {
            const isQuotaReached =
              (survey.participantsCount || 0) >=
              (survey.targetParticipants || Infinity);
            const isCompleted = survey.status === "completed";
            const canParticipate =
              !survey.alreadySubmitted &&
              !isCompleted &&
              survey.status === "active";
            const pct =
              Math.round(
                ((survey.participantsCount || 0) /
                  (survey.targetParticipants || 1)) *
                  100 || 0
              ) || 0;

            return (
              <div
                key={survey.id}
                className={`bg-white p-6 rounded-xl shadow-lg transition-all duration-300 border border-gray-200 ${
                  isCompleted
                    ? "border-l-4 border-l-[#2069BA] opacity-75"
                    : "hover:border-[#2069BA]/30"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {survey.title}
                  </h3>
                  <div className="flex flex-col items-end space-y-2">
                    {survey.isBusinessSurvey && (
                      <span className="bg-[#2069BA]/10 text-[#2069BA] text-xs px-3 py-1 rounded-full font-semibold border border-[#2069BA]/20">
                        {survey.businessName || "Research Company"}
                      </span>
                    )}
                    {isCompleted ? (
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
                        Completed
                      </span>
                    ) : isQuotaReached && survey.status === "active" ? (
                      <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full font-semibold">
                        Quota Full
                      </span>
                    ) : survey.status === "paused" ? (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-semibold">
                        Paused
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mb-4 leading-relaxed">
                  {survey.description}
                </p>

                {survey.isBusinessSurvey && (
                  <div className="bg-[#2069BA]/5 p-4 rounded-xl mb-4 border border-[#2069BA]/20 text-sm text-gray-700">
                    <p className="mb-2">
                      <strong className="text-[#2069BA]">Company:</strong>{" "}
                      {survey.businessName || ""}
                    </p>
                    {!!survey.researchPurpose && (
                      <p className="mb-2">
                        <strong className="text-[#2069BA]">
                          Research Focus:
                        </strong>{" "}
                        {survey.researchPurpose.length > 60
                          ? survey.researchPurpose.substring(0, 60) + "..."
                          : survey.researchPurpose}
                      </p>
                    )}
                    {!!survey.pointsReward && (
                      <p>
                        <strong className="text-[#2069BA]">
                          Points Reward:
                        </strong>{" "}
                        <span className="text-green-600 font-bold">
                          {survey.pointsReward} Points
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center">
                    <span className="font-semibold text-gray-700">Target:</span>
                    <span className="ml-2 text-[#2069BA] font-bold">
                      {survey.targetParticipants || 0} participants
                    </span>
                  </span>
                  <span className="flex items-center">
                    <span className="font-semibold text-gray-700">Reward:</span>
                    <span className="ml-2 text-green-600 font-bold">
                      {survey.pointsReward ?? 20} Points
                    </span>
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>
                      Current Participants: {survey.participantsCount || 0}
                    </span>
                    <span className="font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        pct >= 100
                          ? "bg-[#2069BA]"
                          : pct >= 80
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  {isCompleted && survey.completedAt && (
                    <div className="text-sm text-green-600 font-medium mt-2">
                      Survey completed on{" "}
                      {new Date(survey.completedAt).toLocaleDateString()}
                    </div>
                  )}
                  {isQuotaReached &&
                    !isCompleted &&
                    survey.status === "active" && (
                      <div className="text-sm text-orange-600 font-medium mt-2">
                        Target quota reached - closing soon
                      </div>
                    )}
                  {!isQuotaReached && pct >= 80 && (
                    <div className="text-sm text-orange-600 font-medium mt-2">
                      Approaching quota - limited spots
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {survey.questions ? survey.questions.length : 0} questions
                  </span>
                  <button
                    onClick={() => canParticipate && handleSurveySelect(survey)}
                    className={`px-6 py-2 rounded-xl font-semibold transition-all duration-200 ${
                      !canParticipate
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-[#2069BA] hover:bg-[#1e40af] text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    }`}
                    disabled={!canParticipate}
                    title={
                      isCompleted
                        ? "This survey has been completed"
                        : survey.alreadySubmitted
                        ? "You have already submitted this survey"
                        : survey.status === "paused"
                        ? "This survey is currently paused"
                        : "Click to participate"
                    }
                  >
                    {isCompleted
                      ? "Completed"
                      : survey.alreadySubmitted
                      ? "Already Submitted"
                      : survey.status === "paused"
                      ? "Paused"
                      : "Participate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParticipateSurvey;
