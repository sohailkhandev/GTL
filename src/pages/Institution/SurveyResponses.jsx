// Institution Survey Responses - allows institutions to view responses to their surveys

import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { db } from "@/config/Firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

const SurveyResponses = () => {
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const { user } = useAppContext();

  useEffect(() => {
    if (!user || user.type !== "institution") return;

    // Fetch institution's surveys
    const fetchSurveys = async () => {
      try {
        const surveysQuery = query(
          collection(db, "surveys"),
          where("institutionId", "==", user.uid)
        );
        const snapshot = await getDocs(surveysQuery);
        const surveysData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSurveys(surveysData);
      } catch (error) {
        console.error("Error fetching surveys:", error);
      }
    };

    fetchSurveys();
  }, [user]);

  useEffect(() => {
    if (!user || user.type !== "institution") return;

    // Set up real-time listener for survey responses
    const responsesQuery = query(
      collection(db, "surveyResponses"),
      where("institutionId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(responsesQuery, (querySnapshot) => {
      const responses = [];
      querySnapshot.forEach((doc) => {
        responses.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by date (newest first)
      const sortedResponses = responses.sort(
        (a, b) => b.date?.toDate() - a.date?.toDate()
      );

      setSurveyResponses(sortedResponses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date.toDate) return date.toDate().toLocaleString();
    if (date._seconds) return new Date(date._seconds * 1000).toLocaleString();
    return new Date(date).toLocaleString();
  };

  const getSurveyTitle = (surveyId) => {
    const survey = surveys.find((s) => s.id === surveyId);
    return survey ? survey.title : "Unknown Survey";
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <p>Loading survey responses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">Survey Responses</h2>

      {surveyResponses.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">No survey responses received yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            When users complete your surveys, their responses will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {surveyResponses.map((response) => (
            <div
              key={response.id}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getSurveyTitle(response.surveyId)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Respondent:{" "}
                    {response.respondentName || response.respondentId}
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted: {formatDate(response.date)}
                  </p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  New Response
                </span>
              </div>

              {response.answers && Object.keys(response.answers).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Responses:</h4>
                  {Object.entries(response.answers).map(
                    ([questionId, answer]) => (
                      <div key={questionId} className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Question ID:</strong> {questionId}
                        </p>
                        <p className="text-sm text-gray-800">
                          <strong>Answer:</strong>{" "}
                          {Array.isArray(answer) ? answer.join(", ") : answer}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Response ID: {response.id}
                  </span>
                  <button
                    onClick={() => {
                      // Here you could implement actions like:
                      // - Request genetic sampling
                      // - Send follow-up questions
                      // - Mark as reviewed
                      alert(
                        "Feature: Request genetic sampling or send follow-up questions"
                      );
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Take Action
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SurveyResponses;
