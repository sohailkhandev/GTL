// Institution Survey Builder - allows institutiones to create surveys for users to participate in

import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useSurveyContext } from "../../context/SurveyContext";
import { db, auth } from "@/config/Firebase";
import { collection, getDocs } from "firebase/firestore";
import SurveyPackageDialog from "../../components/PointsRewardDialog";
import { toast } from "react-toastify";
import { updateDocument } from "../../utils/database.utils";

const BusinessSurveyBuilder = () => {
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    description: "",
    type: "text",
    options: [],
    is_required: false,
  });
  const [tempOption, setTempOption] = useState("");
  const [surveys, setSurveys] = useState([]);
  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { user, refreshUserData } = useAppContext();
  const { createSurvey, updateSurvey } = useSurveyContext();

  // Step configuration
  const STEPS = [
    { id: 1, title: "Basics", description: "Title & Category" },
    { id: 2, title: "Questions", description: "Survey Questions (Max 12)" },
    { id: 3, title: "Reward Package", description: "Points & Rewards" },
    { id: 4, title: "Audience", description: "Target Audience & Filters" },
    { id: 5, title: "Preview", description: "Review Survey" },
    { id: 6, title: "Publish", description: "Finalize & Launch" },
  ];

  // Maximum questions allowed per survey
  const MAX_QUESTIONS = 12;

  // Point requirements for creating surveys
  const POINT_REQUIREMENTS = {
    MINIMUM_POINTS: 10000, // Minimum points needed to create any survey
    PACKAGES: [
      { points: 10000, cost: 100 },
      { points: 20000, cost: 200 },
      { points: 50000, cost: 500 },
      { points: 100000, cost: 1000 },
    ],
  };

  // Fetch surveys created by this institution
  useEffect(() => {
    console.log("User object in useEffect:", user);
    console.log("Auth currentUser in useEffect:", auth.currentUser);
    if (user && user.type === "business") {
      fetchBusinessSurveys();
    }
  }, [user]);

  const fetchBusinessSurveys = async () => {
    try {
      // Validate user object before fetching
      if (!user || !user.uid || !user.points) {
        console.error(
          "Cannot fetch surveys: user, user.uid, or user.points is missing",
          user
        );
        return;
      }

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

  // Get current points status
  const getPointsStatus = () => {
    if (!user || !user.points)
      return {
        hasEnough: false,
        current: 0,
        required: POINT_REQUIREMENTS.MINIMUM_POINTS,
      };

    const current = user.points;
    const required = POINT_REQUIREMENTS.MINIMUM_POINTS;
    const hasEnough = current >= required;

    return { hasEnough, current, required };
  };

  // Check if institution has enough points to create surveys
  const hasEnoughPoints = () => {
    return (
      user &&
      user.uid &&
      user.points &&
      user.points >= POINT_REQUIREMENTS.MINIMUM_POINTS
    );
  };

  // Step validation functions
  const validateStep = (step) => {
    if (!editingSurvey) return false;

    switch (step) {
      case 1: // Basics
        return (
          editingSurvey.title &&
          editingSurvey.title.trim() !== "" &&
          editingSurvey.category &&
          editingSurvey.category !== ""
        );
      case 2: // Questions
        return editingSurvey.questions && editingSurvey.questions.length > 0;
      case 3: // Reward Package
        return editingSurvey.pointsReward && editingSurvey.pointsReward > 0;
      case 4: // Audience
        return (
          editingSurvey.targetParticipants &&
          editingSurvey.targetParticipants > 0
        );
      case 5: // Preview - always valid
        return true;
      case 6: // Publish - always valid
        return true;
      default:
        return false;
    }
  };

  // Check if entire survey is complete and ready for publishing
  const isSurveyComplete = () => {
    if (!editingSurvey) return false;

    // Check all required fields across all steps
    const basicsComplete = validateStep(1);
    const questionsComplete = validateStep(2);
    const rewardComplete = validateStep(3);
    const audienceComplete = validateStep(4);

    // All steps must be complete
    return (
      basicsComplete && questionsComplete && rewardComplete && audienceComplete
    );
  };

  const canGoToNextStep = (step) => {
    return validateStep(step);
  };

  const canGoToPreviousStep = (step) => {
    return step > 1;
  };

  const goToNextStep = () => {
    if (canGoToNextStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const goToPreviousStep = () => {
    if (canGoToPreviousStep(currentStep)) {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const goToStep = (step) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
    }
  };

  // Create a new survey
  const handleCreateNewSurvey = () => {
    if (!hasEnoughPoints()) {
      toast.error(
        `You need at least ${POINT_REQUIREMENTS.MINIMUM_POINTS.toLocaleString()} points to create surveys. Current balance: ${(
          user?.points || 0
        ).toLocaleString()} points.`
      );
      return;
    }

    // Show points reward dialog instead of prompt
    setShowPackageDialog(true);
  };

  // Handle points reward submission from dialog
  const handlePointsRewardSubmit = (pointsReward) => {
    // Validate user object
    if (!user || !user.uid || !user.points) {
      console.error(
        "User object not properly loaded in handlePointsRewardSubmit:",
        user
      );
      toast.error(
        "User data is not properly loaded. Please refresh the page and try again."
      );
      return;
    }

    // Check if user has enough points for this package
    if (user.points < pointsReward) {
      toast.error(
        `Insufficient points. You need ${pointsReward.toLocaleString()} points for this package, but you only have ${user.points.toLocaleString()} points.`
      );
      return;
    }

    // Set the selected package for highlighting
    setSelectedPackage(pointsReward);

    const newSurvey = {
      id: `survey-${Date.now()}`,
      title: "New Research Survey",
      description:
        "Please answer these research questions to help us gather valuable insights for our study.",
      researchPurpose:
        "This research aims to gather valuable insights and data to improve our understanding of consumer preferences, market trends, and user behavior. Your responses will help us develop better products and services.",
      researchType: "market_research", // Hardcoded
      category: "general",
      pointsReward: "20", // Default reward for participants (20 points = $0.20)
      targetParticipants: 100,
      questions: [],
      createdAt: new Date().toISOString(),
      institutionId: user.uid,
      institutionName: user.name || user.institutionName,
      status: "active",
      participantsCount: 0,
      isBusinessSurvey: true,
      packageCost: parseInt(pointsReward), // Ensure it's a number
    };

    console.log("Created new survey object:", newSurvey);
    setEditingSurvey(newSurvey);
  };

  // Handle canceling survey creation
  const handleCancelSurvey = () => {
    setEditingSurvey(null);
    setShowPackageDialog(false);
    setSelectedPackage(null);
  };

  // Save survey as draft
  const handleSaveDraft = async () => {
    if (!editingSurvey) return;

    setIsSavingDraft(true);
    try {
      const draftSurvey = {
        ...editingSurvey,
        status: "draft",
        updatedAt: new Date().toISOString(),
      };

      if (editingSurvey.id && surveys.find((s) => s.id === editingSurvey.id)) {
        // Update existing survey
        await updateSurvey(draftSurvey);
        toast.success("Draft saved successfully!");
      } else {
        // Create new draft survey
        const result = await createSurvey(draftSurvey);
        if (result.success) {
          setEditingSurvey({ ...draftSurvey, id: result.surveyId });
          toast.success("Draft saved successfully!");
        }
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Save survey
  const handleSaveSurvey = async () => {
    if (!editingSurvey) return;

    // Wait a moment to ensure user object is fully loaded
    if (!user || !user.uid || !user.points) {
      console.log("Waiting for user object to be fully loaded...");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Validate user authentication before proceeding
    if (!user || !user.uid) {
      // Fallback to auth.currentUser.uid if context user.uid is missing
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        console.error("User not authenticated or missing uid:", user);
        toast.error(
          "Authentication error. Please refresh the page and try again."
        );
        return;
      }
      console.log("Using fallback uid from auth.currentUser:", currentUserId);
    }

    // Final validation after waiting
    if (!user || !user.uid || !user.points) {
      console.error("User object still not properly loaded after wait:", user);
      toast.error(
        "User data is not properly loaded. Please refresh the page and try again."
      );
      return;
    }

    setIsSaving(true);

    try {
      // Check if this survey already exists
      const existingSurvey = surveys.find((s) => s.id === editingSurvey.id);

      if (existingSurvey) {
        // Update existing survey
        await updateSurvey(editingSurvey.id, editingSurvey);
        toast.success("Survey updated successfully!");
      } else {
        // This is a new survey, check points and deduct them
        if (!user.points || user.points === undefined) {
          console.error("User points is undefined or null:", user.points);
          toast.error(
            "User points information is missing. Please refresh the page and try again."
          );
          return;
        }

        if (!editingSurvey.packageCost || editingSurvey.packageCost <= 0) {
          console.error("Invalid package cost:", editingSurvey.packageCost);
          toast.error(
            "Invalid survey package cost. Please select a valid package."
          );
          return;
        }

        if (user.points < editingSurvey.packageCost) {
          toast.error(
            `Insufficient points. You need ${editingSurvey.packageCost.toLocaleString()} points for this package, but you only have ${user.points.toLocaleString()} points.`
          );
          return;
        }

        try {
          // Refresh user data first to ensure we have the latest points value
          console.log("Refreshing user data before points deduction...");
          await refreshUserData();

          // Get the updated user object
          const updatedUser = { ...user };
          console.log("Updated user object after refresh:", updatedUser);

          // Validate that the updated user object has valid points
          if (!updatedUser.points || updatedUser.points === undefined) {
            console.error(
              "Updated user object still missing points:",
              updatedUser
            );
            toast.error(
              "Unable to retrieve current points balance. Please refresh the page and try again."
            );
            return;
          }

          // Create new survey first
          await createSurvey(editingSurvey);

          // Get the user ID (use fallback if context user.uid is missing)
          const userId = updatedUser?.uid || auth.currentUser?.uid;
          console.log("Raw userId values:", {
            contextUid: user?.uid,
            authUid: auth.currentUser?.uid,
            finalUserId: userId,
          });

          if (!userId) {
            console.error("No user ID available for points deduction");
            toast.error(
              "Authentication error. Please refresh the page and try again."
            );
            return;
          }

          // Validate userId is not empty
          if (typeof userId !== "string" || userId.trim() === "") {
            console.error("Invalid userId:", userId, "Type:", typeof userId);
            toast.error(
              "Invalid user ID. Please refresh the page and try again."
            );
            return;
          }

          // Then deduct points from user account
          const newPointsBalance =
            updatedUser.points - editingSurvey.packageCost;
          console.log("Deducting points:", {
            currentPoints: updatedUser.points,
            packageCost: editingSurvey.packageCost,
            newBalance: newPointsBalance,
            userId: userId,
            userIdType: typeof userId,
            userIdLength: userId.length,
          });

          // Log the exact parameters being passed to updateDocument
          const updateParams = {
            collectionName: "users",
            documentId: userId,
            data: { points: newPointsBalance },
          };
          console.log("updateDocument parameters:", updateParams);

          try {
            console.log("Calling updateDocument with:", updateParams);
            await updateDocument(updateParams);
            console.log("Points deduction successful");
          } catch (updateError) {
            console.error("Error in updateDocument call:", updateError);
            console.error("Error details:", {
              message: updateError.message,
              code: updateError.code,
              stack: updateError.stack,
            });

            // Try fallback approach with direct Firebase calls
            console.log("Attempting fallback with direct Firebase update...");
            try {
              const { doc, updateDoc } = await import("firebase/firestore");
              const userDocRef = doc(db, "users", userId);
              await updateDoc(userDocRef, { points: newPointsBalance });
              console.log("Fallback points deduction successful");
            } catch (fallbackError) {
              console.error("Fallback also failed:", fallbackError);
              throw updateError; // Throw the original error
            }
          }

          // Refresh user data to reflect the new points balance
          console.log("Refreshing user data after points deduction...");
          await refreshUserData();

          // Verify the points deduction by checking the updated user object
          const finalUserCheck = { ...user };
          console.log(
            "Final user check after points deduction:",
            finalUserCheck
          );

          if (finalUserCheck.points !== newPointsBalance) {
            console.warn(
              "Points deduction verification failed. Expected:",
              newPointsBalance,
              "Got:",
              finalUserCheck.points
            );
            // Don't show warning toast - just log it for debugging
          } else {
            console.log("Points deduction verified successfully!");
          }

          toast.success(`Survey created successfully!`);
        } catch (error) {
          console.error("Error creating survey or deducting points:", error);
          toast.error("Failed to create survey. Please try again.");
          return; // Don't proceed if there's an error
        }
      }
      setEditingSurvey(null);
      fetchBusinessSurveys(); // Refresh the list
    } catch (error) {
      console.error("Error saving survey:", error);
      toast.error("Failed to save survey. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add a new question
  const handleAddQuestion = () => {
    if (!editingSurvey || !newQuestion.text) return;

    // Check if maximum questions limit is reached
    if (editingSurvey.questions.length >= MAX_QUESTIONS) {
      toast.warning(
        `Maximum of ${MAX_QUESTIONS} questions allowed per survey.`
      );
      return;
    }

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
    toast.success("Option added successfully!");
  };

  const handleRemoveOption = (index) => {
    setNewQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
    toast.success("Option removed successfully!");
  };

  const handleRemoveQuestion = (questionId) => {
    setEditingSurvey((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
    toast.success("Question removed successfully!");
  };

  const toggleSurveyStatus = async (surveyId, currentStatus) => {
    // Validate user object
    if (!user || !user.uid || !user.points) {
      toast.error(
        "User data is not properly loaded. Please refresh the page and try again."
      );
      return;
    }

    // Don't allow status changes for completed surveys
    if (currentStatus === "completed") {
      toast.info("This survey has been completed and cannot be modified.");
      return;
    }

    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      await updateSurvey(surveyId, { status: newStatus });
      fetchBusinessSurveys(); // Refresh the list
      toast.success(
        `Survey ${
          newStatus === "active" ? "activated" : "paused"
        } successfully!`
      );
    } catch (error) {
      console.error("Error updating survey status:", error);
      toast.error("Failed to update survey status. Please try again.");
    }
  };

  // Get status display information
  const getStatusInfo = (survey) => {
    const isQuotaReached =
      survey.participantsCount >= survey.targetParticipants;

    switch (survey.status) {
      case "active":
        if (isQuotaReached) {
          return {
            text: "Quota Full",
            bgColor: "bg-orange-100 text-orange-800",
            description: "Target participants reached",
          };
        }
        return {
          text: "Active",
          bgColor: "bg-green-100 text-green-800",
          description: "Accepting participants",
        };
      case "paused":
        return {
          text: "Paused",
          bgColor: "bg-yellow-100 text-yellow-800",
          description: "Temporarily paused",
        };
      case "completed":
        return {
          text: "Completed",
          bgColor: "bg-[#2069BA]/10 text-[#2069BA] border border-[#2069BA]/20",
          description: "Survey closed - quota reached",
        };
      default:
        return {
          text: survey.status || "Active",
          bgColor: "bg-gray-100 text-gray-800",
          description: "Unknown status",
        };
    }
  };

  if (!user || user.type !== "business") {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Business access required
        </h2>
        <p>Please login with a business account to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">Survey Builder</h2>

      {/* Points Requirement Notice */}
      <div className="bg-gradient-to-r from-[#2069BA]/10 to-[#1e40af]/10 border border-[#2069BA]/20 rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center mb-4">
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#2069BA]">
              Survey Creation Packages
            </h3>
            <p className="text-gray-600 text-sm">
              Choose a package to create your survey. Points will be deducted
              from your account.
            </p>
          </div>
        </div>

        {/* Current Points Status */}
        <div className="grid md:grid-cols-1 gap-6 mb-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-md">
            <label className="block text-sm font-semibold text-[#2069BA] mb-2">
              Your Current Balance
            </label>
            <div className="flex items-center space-x-3">
              <span
                className={`text-2xl font-bold ${
                  getPointsStatus().hasEnough
                    ? "text-green-600"
                    : "text-red-600"
                } bg-gray-50 px-4 py-2 rounded-xl border border-gray-200`}
              >
                {(user?.points || 0).toLocaleString()} Points
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {getPointsStatus().hasEnough
                ? "You can create surveys!"
                : `Need ${(
                    POINT_REQUIREMENTS.MINIMUM_POINTS - (user?.points || 0)
                  ).toLocaleString()} more points to access survey creation`}
            </p>
          </div>
        </div>

        {/* Point Packages */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-md">
          <h4 className="font-semibold text-[#2069BA] mb-3">
            Survey Creation Packages
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {POINT_REQUIREMENTS.PACKAGES.map((pkg, index) => (
              <div
                key={index}
                className={`text-center p-3 rounded-lg border transition-all duration-200 ${
                  selectedPackage === pkg.points
                    ? "bg-[#2069BA] text-white border-[#2069BA] shadow-lg scale-105"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`text-lg font-bold ${
                    selectedPackage === pkg.points
                      ? "text-white"
                      : "text-[#2069BA]"
                  }`}
                >
                  {pkg.points.toLocaleString()}
                </div>
                <div
                  className={`text-sm ${
                    selectedPackage === pkg.points
                      ? "text-blue-100"
                      : "text-gray-600"
                  }`}
                >
                  points
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Choose a package when creating your survey
          </p>
        </div>
      </div>

      {!editingSurvey ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Your Surveys</h3>
            <div className="space-x-2">
              <button
                onClick={handleCreateNewSurvey}
                disabled={!hasEnoughPoints()}
                className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                  hasEnoughPoints()
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed"
                }`}
                title={
                  hasEnoughPoints()
                    ? "Create a new survey"
                    : `You need ${POINT_REQUIREMENTS.MINIMUM_POINTS.toLocaleString()} points to create surveys`
                }
              >
                {hasEnoughPoints()
                  ? "Create New Survey"
                  : "Insufficient Points"}
              </button>
            </div>
          </div>

          {surveys.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-500">No surveys created yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first survey to start collecting research data from
                users.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {surveys.map((survey) => {
                const statusInfo = getStatusInfo(survey);
                const isQuotaReached =
                  survey.participantsCount >= survey.targetParticipants;

                return (
                  <div
                    key={survey.id}
                    className={`bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${
                      survey.status === "completed"
                        ? "border-l-4 border-l-[#2069BA]"
                        : ""
                    }`}
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
                          className={`px-2 py-1 text-xs rounded-full ${statusInfo.bgColor}`}
                        >
                          {statusInfo.text}
                        </span>
                        <span className="bg-[#2069BA]/10 text-[#2069BA] text-xs px-2 py-1 rounded-full border border-[#2069BA]/20">
                          Research Company
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
                          <span className="font-medium">Points Reward:</span>{" "}
                          <span className="text-green-600 font-bold">
                            {survey.pointsReward || "20"} Points
                          </span>
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <span className="font-medium">Current:</span>{" "}
                          {survey.participantsCount || 0} participants
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Questions:</span>{" "}
                          {survey.questions?.length || 0} / {MAX_QUESTIONS}
                        </span>
                      </div>

                      {/* Progress bar for participant quota */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isQuotaReached
                              ? "bg-[#2069BA]"
                              : survey.participantsCount /
                                  survey.targetParticipants >=
                                0.8
                              ? "bg-orange-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (survey.participantsCount /
                                survey.targetParticipants) *
                                100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>

                      {/* Quota status message */}
                      {isQuotaReached && (
                        <div className="text-sm text-[#2069BA] font-medium">
                          Target quota reached - Survey automatically closed
                          {survey.completedAt && (
                            <span className="block text-xs text-[#2069BA]/70 mt-1">
                              Completed on:{" "}
                              {new Date(
                                survey.completedAt
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                      {!isQuotaReached &&
                        survey.participantsCount / survey.targetParticipants >=
                          0.8 && (
                          <div className="text-sm text-orange-600 font-medium">
                            Approaching target quota (
                            {Math.round(
                              (survey.participantsCount /
                                survey.targetParticipants) *
                                100
                            )}
                            %)
                          </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                      {survey.status !== "completed" ? (
                        <button
                          onClick={() =>
                            toggleSurveyStatus(survey.id, survey.status)
                          }
                          className={`px-3 py-1 rounded text-sm shadow-lg hover:shadow-xl transition-all duration-200 ${
                            survey.status === "active"
                              ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                        >
                          {survey.status === "active" ? "Pause" : "Activate"}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500 font-medium">
                          Auto-closed
                        </span>
                      )}

                      {survey.status !== "completed" && (
                        <button
                          onClick={() => setEditingSurvey(survey)}
                          className="bg-[#2069BA] hover:bg-[#1e40af] text-white px-3 py-1 rounded text-sm shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Editing Survey</h3>
          </div>
          {/* Step Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Step {currentStep} of {STEPS.length}:{" "}
                {STEPS[currentStep - 1].title}
              </h2>
              <span className="text-sm text-gray-500">
                {STEPS[currentStep - 1].description}
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
                    onClick={() => goToStep(step.id)}
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
                {canGoToPreviousStep(currentStep) && (
                  <button
                    onClick={goToPreviousStep}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-200"
                  >
                    ← Previous
                  </button>
                )}

                {/* Cancel Button */}
                <button
                  onClick={handleCancelSurvey}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>

                {/* Save Draft Button */}
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-all duration-200"
                >
                  {isSavingDraft ? "Saving..." : "Save Draft"}
                </button>

                {currentStep < STEPS.length ? (
                  <button
                    onClick={goToNextStep}
                    disabled={!canGoToNextStep(currentStep)}
                    className={`px-4 py-2 rounded-md transition-all duration-200 ${
                      canGoToNextStep(currentStep)
                        ? "bg-[#2069BA] text-white hover:bg-[#1e40af]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSaveSurvey}
                    disabled={isSaving || !isSurveyComplete()}
                    className={`px-4 py-2 rounded-md transition-all duration-200 ${
                      isSaving || !isSurveyComplete()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {isSaving ? "Publishing..." : "Publish Survey"}
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Step Content */}
          {currentStep === 1 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Survey Title *
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
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Enter survey title..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Give your survey a clear, descriptive title
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Survey Category *
                  </label>
                  <select
                    value={editingSurvey.category || "general"}
                    onChange={(e) =>
                      setEditingSurvey((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="general">General</option>
                    <option value="business">Business & Finance</option>
                    <option value="healthcare">Healthcare & Medical</option>
                    <option value="education">Education & Training</option>
                    <option value="technology">Technology & Software</option>
                    <option value="consumer">Consumer Products</option>
                    <option value="social">Social & Community</option>
                    <option value="academic">Academic Research</option>
                    <option value="other">Other</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Category for better survey organization
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Step 2: Questions */}
          {currentStep === 2 && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium">
                  Questions ({editingSurvey.questions.length} / {MAX_QUESTIONS})
                </h4>
                {editingSurvey.questions.length >= MAX_QUESTIONS && (
                  <span className="text-red-600 text-sm font-medium">
                    Maximum questions reached
                  </span>
                )}
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

              {editingSurvey.questions.length < MAX_QUESTIONS && (
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
                          options:
                            e.target.value === "text" ? [] : prev.options,
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
                      className="h-4 w-4 text-[#2069BA] focus:ring-[#2069BA] border-gray-300 rounded"
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
                          className="bg-[#2069BA] hover:bg-[#1e40af] text-white px-3 py-2 rounded-r shadow-lg hover:shadow-xl transition-all duration-200"
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
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:bg-green-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  >
                    Add Question
                  </button>
                </div>
              )}

              {/* Maximum Questions Warning */}
              {editingSurvey.questions.length >= MAX_QUESTIONS && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-yellow-400 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span className="text-yellow-800 font-medium">
                      Maximum Questions Reached
                    </span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-2">
                    You have reached the maximum limit of {MAX_QUESTIONS}{" "}
                    questions for this survey. Remove some questions if you want
                    to add new ones.
                  </p>
                </div>
              )}
            </>
          )}
          {/* Step 3: Reward Package */}
          {currentStep === 3 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reward Package Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Reward per Participant *
                  </label>
                  <input
                    type="number"
                    value={editingSurvey.pointsReward || ""}
                    onChange={(e) =>
                      setEditingSurvey((prev) => ({
                        ...prev,
                        pointsReward: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="20"
                    min="5"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Points participants will earn (5-100 range)
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Step 4: Audience & Filters */}
          {currentStep === 4 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Target Audience & Filters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Participants *
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
                  <p className="text-xs text-gray-500 mt-1">
                    Survey will automatically close when this quota is reached
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={editingSurvey.minAge || ""}
                      onChange={(e) =>
                        setEditingSurvey((prev) => ({
                          ...prev,
                          minAge: parseInt(e.target.value) || null,
                        }))
                      }
                      placeholder="18"
                      min="13"
                      className="p-2 border border-gray-300 rounded"
                    />
                    <input
                      type="number"
                      value={editingSurvey.maxAge || ""}
                      onChange={(e) =>
                        setEditingSurvey((prev) => ({
                          ...prev,
                          maxAge: parseInt(e.target.value) || null,
                        }))
                      }
                      placeholder="65"
                      min="18"
                      className="p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Min and max age for participants
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Step 5: Preview */}
          {currentStep === 5 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Survey Preview
              </h3>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {editingSurvey.title}
                </h2>
                <p className="text-gray-600 mb-4">
                  {editingSurvey.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium">Research Type:</span>{" "}
                    {editingSurvey.researchType}
                  </div>
                  <div>
                    <span className="font-medium">Target Participants:</span>{" "}
                    {editingSurvey.targetParticipants}
                  </div>
                  <div>
                    <span className="font-medium">Points Reward:</span>{" "}
                    {editingSurvey.pointsReward}
                  </div>
                  <div>
                    <span className="font-medium">Questions:</span>{" "}
                    {editingSurvey.questions.length}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Questions Preview:</h4>
                  {editingSurvey.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="mb-3 p-3 bg-gray-50 rounded"
                    >
                      <div className="font-medium">
                        {index + 1}. {question.text}
                        {question.is_required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>
                      {question.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {question.description}
                        </p>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Type: {question.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Step 6: Publish */}
          {currentStep === 6 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ready to Publish
              </h3>

              {isSurveyComplete() ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg
                      className="w-8 h-8 text-green-500 mr-3"
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
                    <div>
                      <h4 className="text-lg font-medium text-green-900">
                        Survey Ready for Publication
                      </h4>
                      <p className="text-green-700">
                        All required fields have been completed successfully.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Survey Title:</span>
                      <span className="font-medium">{editingSurvey.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium">
                        {editingSurvey.questions.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Target Participants:
                      </span>
                      <span className="font-medium">
                        {editingSurvey.targetParticipants}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Points Reward:</span>
                      <span className="font-medium">
                        {editingSurvey.pointsReward}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Package Cost:</span>
                      <span className="font-medium">
                        {editingSurvey.packageCost} points
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg
                      className="w-8 h-8 text-yellow-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <h4 className="text-lg font-medium text-yellow-900">
                        Survey Not Ready for Publication
                      </h4>
                      <p className="text-yellow-700">
                        Please complete all required fields in previous steps.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span
                        className={`w-4 h-4 rounded-full mr-2 ${
                          validateStep(1) ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span
                        className={
                          validateStep(1) ? "text-green-700" : "text-red-700"
                        }
                      >
                        Step 1 (Basics):{" "}
                        {validateStep(1)
                          ? "Complete"
                          : "Missing title or category"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`w-4 h-4 rounded-full mr-2 ${
                          validateStep(2) ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span
                        className={
                          validateStep(2) ? "text-green-700" : "text-red-700"
                        }
                      >
                        Step 2 (Questions):{" "}
                        {validateStep(2) ? "Complete" : "No questions added"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`w-4 h-4 rounded-full mr-2 ${
                          validateStep(3) ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span
                        className={
                          validateStep(3) ? "text-green-700" : "text-red-700"
                        }
                      >
                        Step 3 (Reward Package):{" "}
                        {validateStep(3) ? "Complete" : "Missing points reward"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`w-4 h-4 rounded-full mr-2 ${
                          validateStep(4) ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span
                        className={
                          validateStep(4) ? "text-green-700" : "text-red-700"
                        }
                      >
                        Step 4 (Audience):{" "}
                        {validateStep(4)
                          ? "Complete"
                          : "Missing target participants"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showPackageDialog && (
        <SurveyPackageDialog
          isOpen={showPackageDialog}
          onClose={() => setShowPackageDialog(false)}
          onSubmit={handlePointsRewardSubmit}
          currentPoints={user?.points}
        />
      )}

      {/* Confirmation Dialog for Points Deduction */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Survey Creation
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                This will deduct{" "}
                {editingSurvey?.packageCost?.toLocaleString() || 0} points from
                your account.
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-yellow-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="text-yellow-800 font-medium">
                    Points will be deducted
                  </span>
                </div>
                <p className="text-yellow-700 text-sm mt-2">
                  Your current balance: {(user?.points || 0).toLocaleString()}{" "}
                  points
                </p>
                <p className="text-yellow-700 text-sm">
                  After deduction:{" "}
                  {(
                    (user?.points || 0) - (editingSurvey?.packageCost || 0)
                  ).toLocaleString()}{" "}
                  points
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    handleSaveSurvey();
                  }}
                  className="flex-1 px-4 py-2 bg-[#2069BA] text-white rounded-md hover:bg-[#1e40af]"
                >
                  Confirm & Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSurveyBuilder;
