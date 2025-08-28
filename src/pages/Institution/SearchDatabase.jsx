// search database page from where the user will make a search

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { db, functions } from "@/config/Firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

const SearchDatabase = () => {
  const [searchCriteria, setSearchCriteria] = useState({
    ageRange: [18, 80],
    geneticTraits: [],
    healthConditions: [],
    keywords: "",
    timeRange: "all", // Added timeRange to state
  });
  const [results, setResults] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchid] = useState(null);
  const { user } = useAppContext();
  const navigate = useNavigate();

  // ✅ Load all surveys and submissions from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const submissionsSnap = await getDocs(
          collection(db, "surveySubmissions")
        );
        const surveysSnap = await getDocs(collection(db, "surveys"));

        const subsData = submissionsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const surveysData = surveysSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSubmissions(subsData);
        setSurveys(surveysData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  const handleSearch = async () => {
    if (!user || user.type !== "business") return;

    if (!user.isActive) {
      alert("Your account is inactive. You cannot search the database.");
      return;
    }

    if (user.points <= 0) {
      alert("You don't have enough points to perform a search.");
      return;
    }

    if (searchCriteria.keywords === "") {
      alert("Please enter keyword to make search");
      return;
    }

    setLoading(true);

    try {
      const searchFn = httpsCallable(functions, "searchSubmissions");
      const response = await searchFn({
        keywords: searchCriteria.keywords,
        geneticTraits: searchCriteria.geneticTraits,
        healthConditions: searchCriteria.healthConditions,
        timeRange: searchCriteria.timeRange, // Added timeRange to search params
        currentUserId: user.uid,
      });

      setResults(response.data.results || []);
      setSearchid(response.data.searchId);
    } catch (err) {
      console.error("Error searching:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Contact user
  const handleContactUser = (userId, serveyId) => {
    navigate("/business/proposals", {
      state: {
        selectedUser: { userId },
        serveyId: { serveyId },
        searchId: { searchId },
      },
    });
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

  if (!user?.isActive) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Your Account Is Not Active
        </h2>
        <p>Please wait until admin approve your account</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">Search Database</h2>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-medium mb-4">Search Criteria</h3>

        {/* Keywords */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keywords
          </label>
          <input
            type="text"
            value={searchCriteria.keywords}
            onChange={(e) =>
              setSearchCriteria((prev) => ({
                ...prev,
                keywords: e.target.value,
              }))
            }
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Search for specific terms..."
          />
        </div>

        {/* Time Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Survey Time Range
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "all", label: "All time" },
              { value: "7days", label: "Last 7 days" },
              { value: "30days", label: "Last 30 days" },
              { value: "6months", label: "Last 6 months" },
              { value: "12months", label: "Last 12 months" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="timeRange"
                  value={option.value}
                  checked={searchCriteria.timeRange === option.value}
                  onChange={() =>
                    setSearchCriteria((prev) => ({
                      ...prev,
                      timeRange: option.value,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Genetic Traits */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genetic Traits
          </label>
          <div className="flex flex-wrap gap-2">
            {["BRCA1", "BRCA2", "APOE", "HLA-B27", "CFTR", "HTT", "None"].map(
              (trait) => (
                <button
                  key={trait}
                  onClick={() =>
                    setSearchCriteria((prev) => ({
                      ...prev,
                      geneticTraits: prev.geneticTraits.includes(trait)
                        ? prev.geneticTraits.filter((t) => t !== trait)
                        : [...prev.geneticTraits, trait],
                    }))
                  }
                  className={`px-3 py-1 rounded-full text-sm ${
                    searchCriteria.geneticTraits.includes(trait)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  {trait}
                </button>
              )
            )}
          </div>
        </div>

        {/* Health Conditions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Health Conditions
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              "Diabetes",
              "Hypertension",
              "Alzheimer's",
              "Parkinson's",
              "Asthma",
              "Cancer",
              "None",
            ].map((condition) => (
              <button
                key={condition}
                onClick={() =>
                  setSearchCriteria((prev) => ({
                    ...prev,
                    healthConditions: prev.healthConditions.includes(condition)
                      ? prev.healthConditions.filter((c) => c !== condition)
                      : [...prev.healthConditions, condition],
                  }))
                }
                className={`px-3 py-1 rounded-full text-sm ${
                  searchCriteria.healthConditions.includes(condition)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:bg-blue-300"
        >
          {loading ? "Searching..." : "Search Database"}
        </button>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">
            Search Results ({results.length})
          </h3>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Survey
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((survey, index) => {
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {survey?.surveyTitle || "Unknown Survey"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {survey?.date
                            ? survey.date.toDate
                              ? survey.date.toDate().toLocaleString()
                              : new Date(
                                  survey.date._seconds * 1000
                                ).toLocaleString()
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() =>
                            handleContactUser(survey.userId, survey.surveyId)
                          }
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Contact
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No results found. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
};

export default SearchDatabase;
