// this is institution dashboard page

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, functions } from "@/config/Firebase";
import { useAppContext } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import BusinessPoints from "../../components/InstitutionPoints";

const Dashboard = () => {
  const [stats, setStats] = useState({
    searches: 0,
    proposalsSent: 0,
    proposalsAccepted: 0,
    activeLicenses: 0,
    surveys: 0,
    responses: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allProposals, setAllProposals] = useState([]);
  const [acceptedProposals, setAcceptedProposals] = useState([]);
  const [showAllProposals, setShowAllProposals] = useState(false);
  const [showAcceptedProposals, setShowAcceptedProposals] = useState(false);
  const [surveys, setSurveys] = useState([]);
  const { user: institution } = useAppContext();

  useEffect(() => {
    if (!institution || institution.type !== "business") return;

    // const fetchData = async () => {
    //   try {
    //     // Fetch searches
    //     const searchesQuery = query(
    //       collection(db, "searches"),
    //       where("institutionId", "==", institution.uid)
    //     );
    //     const searchesSnapshot = await getDocs(searchesQuery);
    //     const searchesData = searchesSnapshot.docs.map((doc) => ({
    //       id: doc.id,
    //       ...doc.data(),
    //     }));

    //     // Fetch proposals
    //     const proposalsQuery = query(
    //       collection(db, "proposals"),
    //       where("institutionId", "==", institution.uid)
    //     );
    //     const proposalsSnapshot = await getDocs(proposalsQuery);
    //     const proposalsData = proposalsSnapshot.docs.map((doc) => ({
    //       id: doc.id,
    //       ...doc.data(),
    //     }));

    //     // Set accepted proposals
    //     const accepted = proposalsData.filter((p) => p.status === "accepted");

    //     // Initialize Firebase Functions
    //     const getUserDetails = httpsCallable(functions, "getUserDetails");

    //     // Fetch researcher details for accepted proposals
    //     const acceptedWithDetails = await Promise.all(
    //       accepted.map(async (proposal) => {
    //         if (!proposal.userId) return proposal;

    //         try {
    //           const result = await getUserDetails({ userId: proposal.userId });
    //           return {
    //             ...proposal,
    //             researcherEmail: result.data.email,
    //             researcherName: result.data.name,
    //           };
    //         } catch (error) {
    //           console.error("Error fetching user details:", error);
    //           return {
    //             ...proposal,
    //             researcherEmail: "Error loading email",
    //             researcherName: "Unknown Researcher",
    //           };
    //         }
    //       })
    //     );

    //     // Set all proposals
    //     setAllProposals(proposalsData);
    //     // Set accepted proposals with email data
    //     setAcceptedProposals(acceptedWithDetails);

    //     // Set stats
    //     setStats({
    //       searches: searchesData.length,
    //       proposalsSent: proposalsData.length,
    //       proposalsAccepted: accepted.length,
    //       activeLicenses: 0,
    //     });

    //     // Set recent activity
    //     const activity = [
    //       ...searchesData.map((s) => ({
    //         type: "search",
    //         date: s.date,
    //         details: `${s.resultCount || 0} results for ${s.criteria.keywords}`,
    //       })),
    //       ...proposalsData.map((p) => ({
    //         type: "proposal",
    //         date: p?.sentAt?.toDate() || new Date(),
    //         details: `Status: ${p?.status || "pending"}`,
    //       })),
    //     ]
    //       .sort((a, b) => b.date - a.date)
    //       .slice(0, 5);

    //     setRecentActivity(activity);
    //   } catch (error) {
    //     console.error("Error fetching data:", error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    const fetchData = async () => {
      try {
        // Fetch searches and create a lookup map
        const searchesQuery = query(
          collection(db, "searches"),
          where("institutionId", "==", institution.uid)
        );
        const searchesSnapshot = await getDocs(searchesQuery);
        const searchMap = searchesSnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = { id: doc.id, ...doc.data() };
          return acc;
        }, {});

        // Fetch proposals and enrich with search data
        const proposalsQuery = query(
          collection(db, "proposals"),
          where("institutionId", "==", institution.uid)
        );
        const proposalsSnapshot = await getDocs(proposalsQuery);
        const proposalsData = proposalsSnapshot.docs.map((doc) => {
          const proposal = doc.data();
          return {
            id: doc.id,
            ...proposal,
            searchData: proposal.searchId.searchId
              ? searchMap[proposal.searchId.searchId]
              : null,
          };
        });

        // Filter and enrich accepted proposals with researcher details
        const accepted = proposalsData.filter((p) => p.status === "accepted");
        const getUserDetails = httpsCallable(functions, "getUserDetails");

        const acceptedWithDetails = await Promise.all(
          accepted.map(async (proposal) => {
            if (!proposal.userId) return proposal;

            try {
              const result = await getUserDetails({ userId: proposal.userId });
              return {
                ...proposal,
                researcherEmail: result.data.email,
                researcherName: result.data.name,
                searchData: proposal.searchId.searchId
                  ? searchMap[proposal.searchId.searchId]
                  : null,
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

        // Fetch surveys created by this institution
        const surveysQuery = query(
          collection(db, "surveys"),
          where("institutionId", "==", institution.uid)
        );
        const surveysSnapshot = await getDocs(surveysQuery);
        const surveysData = surveysSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const surveysCount = surveysData.length;

        // Fetch survey responses for this institution
        const responsesQuery = query(
          collection(db, "surveyResponses"),
          where("institutionId", "==", institution.uid)
        );
        const responsesSnapshot = await getDocs(responsesQuery);
        const responsesCount = responsesSnapshot.size;

        // Update state
        setAllProposals(proposalsData);
        setAcceptedProposals(acceptedWithDetails);
        setSurveys(surveysData);
        setStats({
          searches: Object.keys(searchMap).length,
          proposalsSent: proposalsData.length,
          proposalsAccepted: accepted.length,
          activeLicenses: 0,
          surveys: surveysCount,
          responses: responsesCount,
        });

        // Prepare recent activity
        const activity = [
          ...Object.values(searchMap).map((s) => ({
            type: "search",
            date: s.date,
            details: `${s.resultCount || 0} results for ${s.criteria.keywords}`,
          })),
          ...proposalsData.map((p) => ({
            type: "proposal",
            date: p?.sentAt?.toDate() || new Date(),
            details: `Status: ${p?.status || "pending"}`,
          })),
        ]
          .sort((a, b) => b.date - a.date)
          .slice(0, 5);

        setRecentActivity(activity);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [institution]);

  useEffect(() => {
    console.log(allProposals);
  }, [allProposals]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date.toDate) return date.toDate().toLocaleString();
    if (date._seconds) return new Date(date._seconds * 1000).toLocaleString();
    return new Date(date).toLocaleString();
  };

  if (!institution || institution.type !== "business") {
    return <div className="text-center py-8">Business access required</div>;
  }

  if (loading) {
    return <div className="text-center py-8">Loading dashboard data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Searches Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Searches
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.searches}
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals Sent Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
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
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Proposals Sent
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.proposalsSent}
                  </div>
                  <button
                    onClick={() => setShowAllProposals(true)}
                    className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View All
                  </button>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals Accepted Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Proposals Accepted
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.proposalsAccepted}
                  </div>
                  <button
                    onClick={() => setShowAcceptedProposals(true)}
                    className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View All
                  </button>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Surveys Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Surveys Created
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.surveys || 0}
                  </div>
                  <Link
                    to="/business/surveys"
                    className="ml-2 text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    Manage
                  </Link>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Responses Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Survey Responses
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.responses || 0}
                  </div>
                  <Link
                    to="/business/survey-responses"
                    className="ml-2 text-sm font-medium text-orange-600 hover:text-orange-500"
                  >
                    View All
                  </Link>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Active Points Card */}
        <div className="lg:col-span-2">
          <BusinessPoints />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Activity
          </h3>
        </div>
        <div className="bg-white overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <li key={index}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {activity.type === "search"
                          ? "Database Search"
                          : "Research Proposal"}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {formatDate(activity.date)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {activity.details}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No recent activity found
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Survey Management Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Survey Management
            </h3>
            <div className="flex space-x-2">
              <Link
                to="/business/surveys"
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Manage All Surveys
              </Link>
              <Link
                to="/business/survey-responses"
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-orange-600 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Responses
              </Link>
            </div>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {surveys && surveys.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {surveys.slice(0, 4).map((survey) => (
                <div
                  key={survey.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">
                      {survey.title}
                    </h4>
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
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {survey.description || "No description"}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{survey.questions?.length || 0} questions</span>
                    <span>{survey.participantsCount || 0} participants</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3">No surveys created yet</p>
              <Link
                to="/business/surveys"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create Your First Survey
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions and Business Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quick Actions
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link
                to="/business/search"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Search Database
              </Link>
              <Link
                to="/business/licenses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Purchase Points
              </Link>
              <Link
                to="/business/surveys"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create Surveys
              </Link>
              <Link
                to="/business/survey-responses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                View Responses
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Business Status
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {institution.isActive ? (
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3
                  className={`text-sm font-medium ${
                    institution.isActive ? "text-green-800" : "text-yellow-800"
                  }`}
                >
                  {institution.isActive
                    ? "Verified Business"
                    : "Pending Verification"}
                </h3>
                <div className="mt-2 text-sm text-gray-700">
                  <p>
                    {institution.isActive
                      ? "Your business has been verified and has full access to all features."
                      : "Your business is pending verification. Some features may be limited."}
                  </p>
                </div>
                {!institution.isActive && (
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Request Verification
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Proposals Modal */}
      {showAllProposals && (
        <>
          {/* Overlay - separate from modal container */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
            aria-hidden="true"
            onClick={() => setShowAllProposals(false)}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* This element is to trick the browser into centering the modal contents */}
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              {/* Modal Content */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        All Proposals ({allProposals.length})
                      </h3>
                      <div className="mt-2">
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
                              {allProposals.map((proposal, i) => (
                                <tr key={proposal.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {i + 1}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {/* Display formatted search criteria */}
                                    <div className="space-y-1">
                                      <div>
                                        <span className="font-medium">
                                          Keywords:
                                        </span>{" "}
                                        {proposal.searchData?.criteria
                                          ?.keywords || "None"}
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
                                      {proposal.status || "pending"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(proposal.sentAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowAllProposals(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Accepted Proposals Modal */}
      {showAcceptedProposals && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
            onClick={() => setShowAcceptedProposals(false)}
          ></div>

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* This element is to trick the browser into centering the modal contents */}
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              {/* Modal Content */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Accepted Proposals ({acceptedProposals.length})
                      </h3>
                      <div className="mt-2">
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
                                  Proposed User Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Proposed User Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date Accepted
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {acceptedProposals.map((proposal, i) => (
                                <tr key={proposal.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {i + 1}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {/* Display formatted search criteria */}
                                    <div className="space-y-1">
                                      <div>
                                        <span className="font-medium">
                                          Keywords:
                                        </span>{" "}
                                        {proposal.searchData?.criteria
                                          ?.keywords || "None"}
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
                                    {proposal.researcherName}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {proposal.researcherEmail}
                                  </td>

                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(
                                      proposal.acceptedAt || proposal.sentAt
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowAcceptedProposals(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
