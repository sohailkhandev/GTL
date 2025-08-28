// this is the page where user will the his completed surveys

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/config/Firebase";
import { useAppContext } from "@/context/AppContext";
import ProgressiveJackpot from "../../components/ProgressiveJackpot";

const MyActivity = () => {
  const [activeTab, setActiveTab] = useState("surveys");
  const [surveys, setSurveys] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [loadingDecrypt, setLoadingDecrypt] = useState(false);
  const { user } = useAppContext();

  // ✅ Fetch Survey Submissions from Firestore
  useEffect(() => {
    const fetchSurveySubmissions = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "surveySubmissions"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);

        const userSurveys = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setSurveys(userSurveys);
      } catch (error) {
        console.error("Error fetching survey submissions:", error);
      }
    };

    fetchSurveySubmissions();
  }, [user]);

  // ✅ Fetch Research Proposals
  useEffect(() => {
    const fetchProposals = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "proposals"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);

        const userProposals = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          businessName: "Dummy Business", // placeholder
          ...docSnap.data(),
        }));

        setProposals(userProposals);
      } catch (error) {
        console.error("Error fetching proposals:", error);
      }
    };

    fetchProposals();
  }, [user]);

  // ✅ Fetch Shipping Information
  useEffect(() => {
    const fetchShippingInfo = async () => {
      if (!user) return;

      try {
        const docRef = doc(db, "shippingAddresses", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setShippingInfo(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching shipping info:", error);
      }
    };

    fetchShippingInfo();
  }, [user]);

  // ✅ View Survey Details (Decrypt answers)
  const handleViewSurveyDetails = async (survey) => {
    setSelectedSurvey({ ...survey, decryptedAnswers: null });
    setShowSurveyModal(true);
    setLoadingDecrypt(true);

    try {
      const decryptSurveyData = httpsCallable(functions, "decryptSurveyData");
      const res = await decryptSurveyData({ submissionId: survey.id });

      if (res.data) {
        setSelectedSurvey((prev) => ({
          ...prev,
          decryptedAnswers: res.data.answers || {},
          questions: res.data.questions || [],
          surveyTitle: res.data.surveyTitle || prev.surveyTitle || "Survey",
          date: res.data.date || prev.date,
        }));
      }
    } catch (error) {
      console.error("Error decrypting survey data:", error);
    } finally {
      setLoadingDecrypt(false);
    }
  };

  // ✅ View Proposal Details
  const handleViewProposalDetails = (proposal) => {
    setSelectedProposal(proposal);
    setShowProposalModal(true);
  };

  // ✅ Approve Proposal (update in Firestore)
  const handleApproveProposal = async () => {
    try {
      const proposalRef = doc(db, "proposals", selectedProposal.id);
      await updateDoc(proposalRef, { status: "accepted" });

      setProposals((prev) =>
        prev.map((p) =>
          p.id === selectedProposal.id ? { ...p, status: "accepted" } : p
        )
      );

      setSelectedProposal((prev) => ({ ...prev, status: "accepted" }));
    } catch (error) {
      console.error("Error approving proposal:", error);
    }
  };

  if (!user || user.type !== "user") {
    return <div className="text-center py-8">Please login as a user</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">My Activity</h2>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("surveys")}
            className={`px-4 py-2 font-medium ${
              activeTab === "surveys"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Completed Surveys
          </button>
          <button
            onClick={() => setActiveTab("proposals")}
            className={`px-4 py-2 font-medium ${
              activeTab === "proposals"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Research Proposals
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`px-4 py-2 font-medium ${
              activeTab === "shipping"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            DNA Kit Shipping
          </button>
        </div>
      </div>

      {/* Surveys Table */}
      {activeTab === "surveys" ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {surveys.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              You haven't completed any surveys yet.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Survey
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {surveys.map((survey, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {survey.surveyId || "Unknown Survey"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {survey?.date
                          ? survey.date.toDate
                            ? survey.date.toDate().toLocaleString() // ✅ Firestore Timestamp
                            : new Date(
                                survey.date._seconds * 1000
                              ).toLocaleString() // ✅ Normal object
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewSurveyDetails(survey)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : activeTab === "shipping" ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {!shippingInfo ? (
            <div className="p-6 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No DNA Kit Requested
              </h3>
              <p className="text-gray-500 mb-4">
                You haven't requested a DNA collection kit yet. Complete a
                survey first to be eligible.
              </p>
              <a
                href="/shipping-address"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Request DNA Kit
              </a>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  DNA Kit Status
                </h3>
                <a
                  href="/shipping-address"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Update Address
                </a>
              </div>

              {/* Status Card */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {shippingInfo.status === "pending" && (
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {shippingInfo.status === "shipped" && (
                      <svg
                        className="h-5 w-5 text-blue-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {shippingInfo.status === "delivered" && (
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      Status:{" "}
                      {shippingInfo.status === "pending"
                        ? "Pending"
                        : shippingInfo.status === "shipped"
                        ? "Shipped"
                        : shippingInfo.status === "delivered"
                        ? "Delivered"
                        : "Unknown"}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {shippingInfo.status === "pending" &&
                        "Your kit request is being processed"}
                      {shippingInfo.status === "shipped" &&
                        "Your kit is on its way"}
                      {shippingInfo.status === "delivered" &&
                        "Your kit has been delivered"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Shipping Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-900">
                      {shippingInfo.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-900">
                      {shippingInfo.phone}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Address:</span>
                    <span className="ml-2 text-gray-900">
                      {shippingInfo.streetAddress}, {shippingInfo.city},{" "}
                      {shippingInfo.state} {shippingInfo.zipCode}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Country:</span>
                    <span className="ml-2 text-gray-900">
                      {shippingInfo.country}
                    </span>
                  </div>
                  {shippingInfo.specialInstructions && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">
                        Special Instructions:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {shippingInfo.specialInstructions}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {proposals.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              You don't have any research proposals yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {proposals.map((proposal, index) => (
                <div key={index} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{proposal.studyTitle}</h3>
                      <p className="text-sm text-gray-600">
                        {proposal.institutionName}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        proposal.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : proposal.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {proposal.status
                        ? proposal.status.charAt(0).toUpperCase() +
                          proposal.status.slice(1)
                        : "Pending"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                    {proposal.studyDescription}
                  </p>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {proposal?.sentAt
                        ? proposal.sentAt.toDate
                          ? proposal.sentAt.toDate().toLocaleString() // ✅ Firestore Timestamp
                          : new Date(
                              proposal.sentAt._seconds * 1000
                            ).toLocaleString() // ✅ Normal object
                        : "N/A"}
                    </div>
                    <button
                      onClick={() => handleViewProposalDetails(proposal)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ Survey Details Modal */}
      {showSurveyModal && selectedSurvey && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedSurvey.surveyTitle}
                </h3>
                <button
                  onClick={() => setShowSurveyModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Completed on:{" "}
                {selectedSurvey.date?._seconds
                  ? new Date(
                      selectedSurvey.date._seconds * 1000
                    ).toLocaleString()
                  : "N/A"}
              </p>

              {loadingDecrypt ? (
                <p className="text-gray-500">Decrypting answers...</p>
              ) : selectedSurvey.decryptedAnswers &&
                selectedSurvey.questions ? (
                <div className="space-y-4">
                  {selectedSurvey.questions.map((question, idx) => {
                    const answer = selectedSurvey.decryptedAnswers[question.id];
                    return (
                      <div key={idx} className="border-b border-gray-200 pb-3">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {question.text}
                        </h4>
                        {answer ? (
                          Array.isArray(answer) ? (
                            <ul className="list-disc pl-5 text-gray-700">
                              {answer.map((ans, i) => (
                                <li key={i}>{ans}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-700">{answer}</p>
                          )
                        ) : (
                          <p className="text-gray-400">No response</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400">No answers found</p>
              )}

              <div className="mt-6">
                <button
                  onClick={() => setShowSurveyModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Proposal Details Modal */}
      {showProposalModal && selectedProposal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedProposal.studyTitle}
                </h3>
                <button
                  onClick={() => setShowProposalModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Business:</h4>
                  <p className="text-gray-700">
                    {selectedProposal.institutionName}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Status:</h4>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      selectedProposal.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedProposal.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedProposal.status
                      ? selectedProposal.status.charAt(0).toUpperCase() +
                        selectedProposal.status.slice(1)
                      : "Pending"}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Description:</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedProposal.studyDescription}
                  </p>
                </div>
                {selectedProposal.duration && (
                  <div>
                    <h4 className="font-medium text-gray-900">Duration:</h4>
                    <p className="text-gray-700">{selectedProposal.duration}</p>
                  </div>
                )}
                {selectedProposal.compensation && (
                  <div>
                    <h4 className="font-medium text-gray-900">Compensation:</h4>
                    <p className="text-gray-700">
                      {selectedProposal.compensation}
                    </p>
                  </div>
                )}
                {selectedProposal.requirements && (
                  <div>
                    <h4 className="font-medium text-gray-900">Requirements:</h4>
                    <p className="text-gray-700 whitespace-pre-line">
                      {selectedProposal.requirements}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">Sent on:</h4>
                  <p className="text-gray-700">
                    {selectedProposal?.sentAt
                      ? selectedProposal.sentAt.toDate
                        ? selectedProposal.sentAt.toDate().toLocaleString() // ✅ Firestore Timestamp
                        : new Date(
                            selectedProposal.sentAt._seconds * 1000
                          ).toLocaleString() // ✅ Normal object
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                {selectedProposal.status !== "accepted" && (
                  <button
                    onClick={handleApproveProposal}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => setShowProposalModal(false)}
                  className="px-4 py-2 ml-5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyActivity;
