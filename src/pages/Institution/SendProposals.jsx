// send proposal where institution will send proposal to user

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/Firebase"; // make sure you import your initialized Firestore instance

const SendProposal = () => {
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState(null);
  const [serveyId, setServeyId] = useState(null);
  const [searchId, setSearchid] = useState(null);
  const [studyDetails, setStudyDetails] = useState({
    title: "",
    description: "",
    duration: "",
    compensation: "",
    requirements: "",
  });
  const [showForm, setShowForm] = useState(false);
  const { user: institution } = useAppContext();
  const navigate = useNavigate();

  // Check for preselected user from location state or props
  useEffect(() => {
    if (
      location.state?.selectedUser &&
      location.state?.serveyId &&
      location.state?.searchId
    ) {
      setSelectedUser(location.state.selectedUser);
      setServeyId(location.state.serveyId);
      setSearchid(location.state?.searchId);
      setShowForm(true);
    } else {
      navigate("/institution/search");
    }
  }, [location.state]);

  const handleSendRequest = async () => {
    if (!selectedUser || !studyDetails.title || !studyDetails.description) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // ✅ Create new proposal
      const proposalRef = await addDoc(collection(db, "proposals"), {
        institutionId: institution.uid,
        institutionName: institution.name || "",
        userId: selectedUser.userId,
        surveyId: serveyId || "", // ensure you pass surveyId from selectedUser,
        searchId,
        studyTitle: studyDetails.title,
        studyDescription: studyDetails.description,
        duration: studyDetails.duration,
        compensation: studyDetails.compensation,
        requirements: studyDetails.requirements,
        status: "pending",
        sentAt: serverTimestamp(),
      });

      // ✅ Create notification for user
      await addDoc(collection(db, "notifications"), {
        userId: selectedUser.userId,
        institutionId: institution.uid,
        type: "new_proposal",
        message: `New research proposal from ${institution.name}: ${studyDetails.title}`,
        date: serverTimestamp(),
        read: false,
        proposalId: proposalRef.id,
      });

      // ✅ Reset form
      setStudyDetails({
        title: "",
        description: "",
        duration: "",
        compensation: "",
        requirements: "",
      });

      alert("Proposal sent successfully!");
      navigate("/institution/dashboard");
    } catch (error) {
      console.error("Error sending proposal:", error);
      alert("Failed to send proposal. Please try again.");
    }
  };

  if (!institution || institution.type !== "institution") {
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
      <h2 className="text-2xl font-semibold mb-6">Send Research Proposal</h2>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium">Create Research Proposal</h3>
              {/* {selectedUser && (
                <p className="text-sm text-gray-600 mt-1">
                  To: {selectedUser.userName || selectedUser.userEmail}
                </p>
              )} */}
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedUser(null);
                // navigate("/institution/search");
                window.location.href = "/institution/search";
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Back to search
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Study Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studyDetails.title}
                onChange={(e) =>
                  setStudyDetails((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Title of your research study"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Study Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={studyDetails.description}
                onChange={(e) =>
                  setStudyDetails((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded"
                rows="4"
                placeholder="Detailed description of your research study"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  value={studyDetails.duration}
                  onChange={(e) =>
                    setStudyDetails((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., 6 months"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compensation
                </label>
                <input
                  type="text"
                  value={studyDetails.compensation}
                  onChange={(e) =>
                    setStudyDetails((prev) => ({
                      ...prev,
                      compensation: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., $100 gift card"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participation Requirements
              </label>
              <textarea
                value={studyDetails.requirements}
                onChange={(e) =>
                  setStudyDetails((prev) => ({
                    ...prev,
                    requirements: e.target.value,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded"
                rows="2"
                placeholder="Any specific requirements for participants"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSendRequest}
                disabled={!studyDetails.title || !studyDetails.description}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md disabled:bg-blue-300"
              >
                Send Research Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendProposal;
