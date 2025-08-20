// institute management page where admin can manage all institute

import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { db, functions } from "@/config/Firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

const InstitutionManagement = () => {
  const [institutions, setInstitutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("all");
  const { user } = useAppContext();

  // Modal states
  const [showSearchesModal, setShowSearchesModal] = useState(false);
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);
  const [currentInstitution, setCurrentInstitution] = useState(null);
  const [searches, setSearches] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [ploading, setPloading] = useState(false);

  // ✅ Fetch institutions (type = institution) from Firestore
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("type", "==", "institution")
        );
        const querySnapshot = await getDocs(q);
        const fetchedInstitutions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInstitutions(fetchedInstitutions);
      } catch (error) {
        console.error("Error fetching institutions:", error);
      }
    };

    fetchInstitutions();
  }, []);

  // ✅ Fetch institution's searches
  const fetchSearches = async (institutionId) => {
    try {
      const q = query(
        collection(db, "searches"),
        where("institutionId", "==", institutionId)
      );
      const querySnapshot = await getDocs(q);
      const fetchedSearches = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSearches(fetchedSearches);
      setShowSearchesModal(true);
    } catch (error) {
      console.error("Error fetching searches:", error);
    }
  };

  // ✅ Fetch institution's proposals
  const fetchProposals = async (institutionId) => {
    try {
      setPloading(true);
      const q = query(
        collection(db, "proposals"),
        where("institutionId", "==", institutionId)
      );
      const querySnapshot = await getDocs(q);
      const proposalsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Filter and enrich accepted proposals with researcher details
      const getUserDetails = httpsCallable(functions, "getUserDetails");

      const acceptedWithDetails = await Promise.all(
        proposalsData.map(async (proposal) => {
          if (!proposal.userId) return proposal;

          try {
            const result = await getUserDetails({ userId: proposal.userId });
            return {
              ...proposal,
              researcherEmail: result.data.email,
              researcherName: result.data.name,
            };
          } catch (error) {
            console.error("Error fetching user details:", error);
            return {
              ...proposal,
              researcherEmail: "Error loading email",
              researcherName: "Unknown Researcher",
            };
          }
        })
      );

      // Update state
      setProposals(acceptedWithDetails);
      setShowProposalsModal(true);
      setPloading(false);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setPloading(false);
    }
  };

  // ✅ Fetch institution's purchases
  const fetchPurchases = async (institutionId) => {
    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", institutionId)
      );
      const querySnapshot = await getDocs(q);
      const fetchedPurchases = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPurchases(fetchedPurchases);
      setShowPurchasesModal(true);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date.toDate) return date.toDate().toLocaleString();
    if (date._seconds) return new Date(date._seconds * 1000).toLocaleString();
    return new Date(date).toLocaleString();
  };
  // ✅ Toggle verification and update Firestore
  const toggleVerification = async (institutionId) => {
    try {
      const updatedInstitutions = institutions.map((inst) =>
        inst.id === institutionId ? { ...inst, isActive: !inst.isActive } : inst
      );
      setInstitutions(updatedInstitutions);

      const institutionToUpdate = updatedInstitutions.find(
        (i) => i.id === institutionId
      );
      if (institutionToUpdate) {
        await updateDoc(doc(db, "users", institutionId), {
          isActive: institutionToUpdate.isActive,
        });
      }
    } catch (error) {
      console.error("Error updating institution verification:", error);
    }
  };

  // ✅ Search and filter by status
  const filteredInstitutions = institutions.filter((inst) => {
    const matchesSearch =
      inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      verificationStatus === "all" ||
      (verificationStatus === "verified" && inst.isActive) ||
      (verificationStatus === "unverified" && !inst.isActive);
    return matchesSearch && matchesStatus;
  });

  if (!user || user.type !== "admin") {
    return <div className="text-center py-8">Admin access required</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">Institution Management</h2>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search institutions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border border-gray-300 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Status
            </label>
            <select
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded w-full"
            >
              <option value="all">All Institutions</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
          <div className="flex items-end">
            <span className="text-gray-600">
              {filteredInstitutions.length} institutions found
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
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
              {filteredInstitutions.map((inst) => (
                <tr key={inst.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {inst.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {inst.organizationType || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{inst.email}</div>
                    <div className="text-sm text-gray-500">
                      {inst.phone || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {inst.address || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        inst.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {inst.isActive ? "Verified" : "Pending Verification"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => toggleVerification(inst.id)}
                        className={`text-left ${
                          inst.isActive
                            ? "text-yellow-600 hover:text-yellow-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                      >
                        {inst.isActive ? "Unverify" : "Verify"}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentInstitution(inst);
                          fetchSearches(inst.id);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-left"
                      >
                        View Searches
                      </button>
                      <button
                        onClick={() => {
                          setCurrentInstitution(inst);
                          fetchProposals(inst.id);
                        }}
                        disabled={ploading}
                        className="text-purple-600 hover:text-purple-900 text-left"
                      >
                        {ploading ? "Loading" : "View Proposals"}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentInstitution(inst);
                          fetchPurchases(inst.id);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 text-left"
                      >
                        View Purchases
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Searches Modal */}
      {showSearchesModal && (
        <>
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white border-black border-2 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  Searches for {currentInstitution?.name}
                </h3>
                <button
                  onClick={() => setShowSearchesModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              {searches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Search Query
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Results
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {searches.map((search) => (
                        <tr key={search.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div>
                                <span className="font-medium">Keywords:</span>{" "}
                                {search?.criteria?.keywords || "None"}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Genetic Traits:
                                </span>{" "}
                                {search?.criteria?.geneticTraits?.join(", ") ||
                                  "None"}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Health Conditions:
                                </span>{" "}
                                {search?.criteria?.criteria?.healthConditions?.join(
                                  ", "
                                ) || "None"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(search.date?.toDate()).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {search.resultCount || 0} results
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">
                  No searches found for this institution.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Proposals Modal */}
      {showProposalsModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border-black border-2 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Proposals for {currentInstitution?.name}
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
                        Your Search
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Sent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proposals.map((proposal, i) => (
                      <tr key={proposal.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {i + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {/* Display formatted search criteria */}
                          <div className="space-y-1">
                            <div>
                              <span className="font-medium">Keywords:</span>{" "}
                              {proposal.searchData?.criteria?.keywords ||
                                "None"}
                            </div>
                            <div>
                              <span className="font-medium">
                                Genetic Traits:
                              </span>{" "}
                              {proposal.searchData?.criteria?.geneticTraits?.join(
                                ", "
                              ) || "None"}
                            </div>
                            <div>
                              <span className="font-medium">
                                Health Conditions:
                              </span>{" "}
                              {proposal.searchData?.criteria?.healthConditions?.join(
                                ", "
                              ) || "None"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              proposal.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : proposal.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {proposal.status}
                          </span>
                          <br />
                          {proposal.status === "accepted" && (
                            <>
                              {proposal.researcherName}&nbsp;-&nbsp;
                              {proposal.researcherEmail}
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(proposal.sentAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">
                No proposals found for this institution.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Purchases Modal */}
      {showPurchasesModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border-black border-2 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Purchases for {currentInstitution?.name}
              </h3>
              <button
                onClick={() => setShowPurchasesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            {purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {purchase.id.substring(0, 8)}...
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {purchase.points}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              purchase.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : purchase.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {purchase.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(
                              purchase.paidAt?.toDate()
                            ).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            ${purchase.amount?.toFixed(2) || "0.00"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">
                No purchases found for this institution.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionManagement;
