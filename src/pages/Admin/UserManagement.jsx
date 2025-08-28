// users management is from where the admin will manage all users

import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { db } from "@/config/Firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const { user } = useAppContext();

  // Modal states
  const [showSurveysModal, setShowSurveysModal] = useState(false);
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [proposals, setProposals] = useState([]);

  // ✅ Fetch users from Firestore (only type === "user")
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"), where("type", "==", "user"));
        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const fetchSurveys = async (userId) => {
    try {
      // First fetch all survey submissions for this user
      const submissionsQuery = query(
        collection(db, "surveySubmissions"),
        where("userId", "==", userId)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);

      // Get all survey IDs from submissions
      const surveyIds = submissionsSnapshot.docs.map(
        (doc) => doc.data().surveyId
      );

      // Fetch details for each survey
      const surveysQuery = query(
        collection(db, "surveys"),
        where("__name__", "in", surveyIds)
      );
      const surveysSnapshot = await getDocs(surveysQuery);

      // Combine submission data with survey details
      const fetchedSurveys = submissionsSnapshot.docs.map((submissionDoc) => {
        const submissionData = submissionDoc.data();
        const surveyDoc = surveysSnapshot.docs.find(
          (doc) => doc.id === submissionData.surveyId
        );

        return {
          submissionId: submissionDoc.id,
          ...submissionData,
          survey: surveyDoc?.data() || null,
        };
      });

      console.log(fetchedSurveys);
      setSurveys(fetchedSurveys);
      setShowSurveysModal(true);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    }
  };

  const fetchAcceptedProposals = async (userId) => {
    try {
      // First fetch all accepted proposals for this user
      const proposalsQuery = query(
        collection(db, "proposals"),
        where("userId", "==", userId),
        where("status", "==", "accepted")
      );
      const proposalsSnapshot = await getDocs(proposalsQuery);

      // Get all unique survey IDs from proposals
      const surveyIds = proposalsSnapshot.docs
        .map((doc) => doc.data().surveyId?.serveyId) // Access nested surveyId
        .filter((id) => id); // Remove any undefined/null values

      // Fetch details for each survey
      const surveysQuery = query(
        collection(db, "surveys"),
        where("id", "in", surveyIds)
      );
      const surveysSnapshot = await getDocs(surveysQuery);

      // Combine proposal data with survey details
      const fetchedProposals = proposalsSnapshot.docs.map((proposalDoc) => {
        const proposalData = proposalDoc.data();
        const surveyDoc = surveysSnapshot.docs.find(
          (doc) => doc.id === proposalData.surveyId?.serveyId
        );

        return {
          proposalId: proposalDoc.id,
          ...proposalData,
          survey: surveyDoc?.data() || null,
        };
      });

      console.log(fetchedProposals);
      setProposals(fetchedProposals);
      setShowProposalsModal(true);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    }
  };

  // ✅ Toggle active/inactive status and update Firestore
  const toggleUserStatus = async (userId) => {
    try {
      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      );
      setUsers(updatedUsers);

      const userToUpdate = updatedUsers.find((u) => u.id === userId);
      if (userToUpdate) {
        await updateDoc(doc(db, "users", userId), {
          isActive: userToUpdate.isActive,
        });
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  // ✅ Search filter
  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (!user || user.type !== "admin") {
    return <div className="text-center py-8">Admin access required</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">User Management</h2>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-gray-300 rounded w-64"
          />
          <span className="text-gray-600">
            {filteredUsers.length} users found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user, i) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {i + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`text-left ${
                          user.isActive
                            ? "text-red-600 hover:text-red-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentUser(user);
                          fetchSurveys(user.id);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-left"
                      >
                        View Submitted Surveys
                      </button>
                      <button
                        onClick={() => {
                          setCurrentUser(user);
                          fetchAcceptedProposals(user.id);
                        }}
                        className="text-purple-600 hover:text-purple-900 text-left"
                      >
                        View Accepted Proposals
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Submitted Surveys Modal */}
      {showSurveysModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Submitted Surveys by {currentUser?.name}
              </h3>
              <button
                onClick={() => setShowSurveysModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            {surveys.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Survey Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {surveys.map((survey, i) => (
                      <tr key={survey.surveyId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{i + 1}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {survey?.survey?.title || "Untitled Survey"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {survey.date?.toDate
                              ? new Date(survey.date.toDate()).toLocaleString()
                              : "N/A"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No surveys found for this user.</p>
            )}
          </div>
        </div>
      )}

      {/* Accepted Proposals Modal */}
      {showProposalsModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Accepted Proposals by {currentUser?.name}
              </h3>
              <button
                onClick={() => setShowProposalsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            {proposals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proposal Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Accepted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Survey Title
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proposals.map((proposal, i) => (
                      <tr key={proposal.proposalId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{i + 1}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {proposal.studyTitle || "Untitled Proposal"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {proposal.institutionName || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {proposal.sentAt?.toDate
                              ? new Date(
                                  proposal.sentAt.toDate()
                                ).toLocaleString()
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {proposal?.survey?.title}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">
                No accepted proposals found for this user.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
