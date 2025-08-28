import { useState, useEffect, useRef, useCallback } from "react";
import CountUp from "react-countup";
import { onSnapshot, collection, doc } from "firebase/firestore";
import { db } from "../config/Firebase";
import {
  getCurrentJackpotValues,
  getRecentWinners,
  initializeJackpots,
} from "../services/jackpotService";

const ProgressiveJackpot = () => {
  const [jackpots, setJackpots] = useState({
    lucky: { points: 0, winners: [] },
    dream: { points: 0, winners: [] },
    miracle: { points: 0, winners: [] },
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Refs for real-time updates
  const unsubscribeRef = useRef(null);

  // Progressive Reward configuration
  const JACKPOT_CONFIG = {
    lucky: {
      name: "Lucky",
      giftCardValue: 20, // $20 gift card
      probability: 10000, // 1 in 10,000
      fundingPercentage: 0.5, // 50% of jackpot funding
      failureContribution: 0.05, // $0.05 added on failure
    },
    dream: {
      name: "Dream",
      giftCardValue: 200, // $200 gift card
      probability: 100000, // 1 in 100,000
      fundingPercentage: 0.3, // 30% of jackpot funding
      failureContribution: 0.03, // $0.03 added on failure
    },
    miracle: {
      name: "Miracle",
      giftCardValue: 2000, // $2000 gift card
      probability: 1000000, // 1 in 1,000,000
      fundingPercentage: 0.2, // 20% of jackpot funding
      failureContribution: 0.02, // $0.02 added on failure
    },
  };

  // Check if user prefers reduced motion
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Optimized animation duration based on accessibility preferences
  const getAnimationDuration = useCallback(() => {
    return prefersReducedMotion() ? 0.1 : 0.8;
  }, []);

  // Firebase Firestore real-time listener
  const setupFirestoreListener = useCallback(() => {
    try {
      const jackpotsRef = collection(db, "jackpots");

      const unsubscribe = onSnapshot(
        jackpotsRef,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "modified" || change.type === "added") {
              const jackpotData = change.doc.data();
              const jackpotId = change.doc.id;

              setJackpots((prevJackpots) => {
                if (prevJackpots[jackpotId]) {
                  return {
                    ...prevJackpots,
                    [jackpotId]: {
                      ...prevJackpots[jackpotId],
                      points: jackpotData.points || 0,
                    },
                  };
                }
                return prevJackpots;
              });

              setLastUpdate(new Date());
              setIsConnected(true);
            }
          });
        },
        (error) => {
          console.error("Firestore listener error:", error);
          setIsConnected(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Firestore listener setup failed:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        await initializeJackpots();
        await fetchJackpotData();
      } catch (error) {
        console.error("Error initializing progressive rewards:", error);
        await fetchJackpotData();
      }
    };

    initializeAndFetch();

    // Setup real-time listener
    const unsubscribe = setupFirestoreListener();
    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setupFirestoreListener]);

  const fetchJackpotData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const jackpotData = await getCurrentJackpotValues();
      const winnersData = await getRecentWinners();

      const processedJackpots = {};
      Object.keys(JACKPOT_CONFIG).forEach((key) => {
        const jackpot = jackpotData[key] || { points: 0 };
        const winners = Array.isArray(winnersData)
          ? winnersData.filter((w) => w.jackpotType === key)
          : [];

        processedJackpots[key] = {
          points: jackpot.points || 0,
          winners: winners.slice(0, 10),
        };
      });

      setJackpots(processedJackpots);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching progressive reward data:", error);
      setError("Failed to load progressive reward data. Please try again.");
      const defaultJackpots = {};
      Object.keys(JACKPOT_CONFIG).forEach((key) => {
        defaultJackpots[key] = { points: 0, winners: [] };
      });
      setJackpots(defaultJackpots);
    } finally {
      setIsLoading(false);
    }
  };

  const formatProgressiveRewardDisplay = (points, config) => {
    const giftCardCount = Math.floor(points / (config.giftCardValue * 100));
    const localizedCount = giftCardCount.toLocaleString();

    return {
      value: localizedCount,
      unit: "pts",
    };
  };

  const maskEmail = (email) => {
    if (!email) return "Unknown";
    const [username, domain] = email.split("@");
    if (username.length <= 2) return email;
    return `${username.charAt(0)}***${username.charAt(
      username.length - 1
    )}@${domain}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl my-4">
      {/* Progressive Reward Display - Simplified */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.entries(JACKPOT_CONFIG).map(([key, config]) => {
          const displayData = formatProgressiveRewardDisplay(
            jackpots[key]?.points || 0,
            config
          );

          return (
            <div
              key={key}
              className="p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-[#2069BA] transition-all duration-300 cursor-pointer relative bg-white"
              onClick={() => setShowLeaderboard(true)}
            >
              {/* Live indicator - Top Right */}
              <div className="absolute top-4 right-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-gray-500 font-medium">
                    Live
                  </span>
                </div>
              </div>

              <div className="text-center my-4">
                <h4 className="text-xl font-bold text-[#2069BA] mb-6">
                  {config.name}
                </h4>

                {/* Progressive Reward Value */}
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-2">
                    Progressive Reward:
                  </div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    <CountUp
                      end={parseInt(displayData.value.replace(/,/g, ""))}
                      duration={getAnimationDuration()}
                      separator=","
                      useEasing={!prefersReducedMotion()}
                      start={0}
                      delay={0}
                      preserveValue={true}
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    {displayData.unit}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#2069BA]">
                  Progressive Reward Winners
                </h3>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Progressive Reward Winners Tables */}
              {Object.entries(JACKPOT_CONFIG).map(([key, config]) => (
                <div key={key} className="mb-8">
                  <h4 className="text-xl font-semibold text-[#2069BA] mb-4">
                    {config.name} Progressive Reward Winners
                  </h4>

                  {jackpots[key]?.winners &&
                  jackpots[key].winners.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 px-4 py-2 text-left">
                              Rank
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left">
                              Winner
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left">
                              Won At
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left">
                              Prize
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {jackpots[key].winners.map((winner, index) => (
                            <tr key={winner.id} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-4 py-2">
                                <span
                                  className={`font-bold ${
                                    index === 0
                                      ? "text-yellow-600"
                                      : index === 1
                                      ? "text-gray-600"
                                      : index === 2
                                      ? "text-orange-600"
                                      : "text-gray-500"
                                  }`}
                                >
                                  #{index + 1}
                                </span>
                              </td>
                              <td className="border border-gray-200 px-4 py-2">
                                {maskEmail(winner.userEmail)}
                              </td>
                              <td className="border border-gray-200 px-4 py-2">
                                {new Date(winner.wonAt).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 font-semibold text-green-600">
                                ${config.giftCardValue} Gift Card
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2 font-bold text-[#2069BA]">
                        No Winners Yet
                      </div>
                      <div>
                        No winners yet for {config.name} Progressive Reward
                      </div>
                      <div className="text-sm mt-1">Be the first to win!</div>
                    </div>
                  )}
                </div>
              ))}

              <div className="text-center mt-6">
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="bg-[#2069BA] hover:bg-[#1e40af] text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Close Leaderboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveJackpot;
