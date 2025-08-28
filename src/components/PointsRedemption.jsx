import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { updateDocument } from "../utils/database.utils";

const PointsRedemption = () => {
  const { user, refreshUserData } = useAppContext();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [selectedGiftCard, setSelectedGiftCard] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Gift card options (minimum 2,000 points = $20)
  const GIFT_CARD_OPTIONS = [
    { name: "Google Play", points: 2000, value: 20, image: "GP" },
    { name: "Apple App Store", points: 2000, value: 20, image: "AS" },
    { name: "Amazon", points: 2000, value: 20, image: "AM" },
    { name: "Google Play", points: 5000, value: 50, image: "GP" },
    { name: "Apple App Store", points: 5000, value: 50, image: "AS" },
    { name: "Amazon", points: 5000, value: 50, image: "AM" },
    { name: "Google Play", points: 10000, value: 100, image: "GP" },
    { name: "Apple App Store", points: 10000, value: 100, image: "AS" },
    { name: "Amazon", points: 10000, value: 100, image: "AM" },
  ];

  const canRedeem = user && user.points >= 2000;

  const handleRedemption = async () => {
    if (!selectedGiftCard || !canRedeem) return;

    const giftCard = GIFT_CARD_OPTIONS.find(
      (gc) => gc.name === selectedGiftCard
    );
    if (!giftCard) return;

    setIsRedeeming(true);
    try {
      // Deduct points from user
      const newPoints = user.points - giftCard.points;
      await updateDocument({
        collectionName: "users",
        documentId: user.uid,
        data: { points: newPoints },
      });

      // Record redemption
      await updateDocument({
        collectionName: "pointRedemptions",
        data: {
          userId: user.uid,
          userEmail: user.email,
          giftCardName: giftCard.name,
          giftCardValue: giftCard.value,
          pointsSpent: giftCard.points,
          redeemedAt: new Date().toISOString(),
          status: "pending",
          giftCardDelivered: false,
        },
      });

      // Refresh user data
      await refreshUserData();
      setShowSuccess(true);
      setSelectedGiftCard("");

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error("Error redeeming points:", error);
      alert("Failed to redeem points. Please try again.");
    } finally {
      setIsRedeeming(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-[#2069BA] mb-2">
          Points Redemption
        </h3>
        <p className="text-gray-600">
          Redeem your points for digital gift cards
        </p>
      </div>

      {/* Current Points Display */}
      <div className="bg-gradient-to-r from-[#2069BA]/10 to-green-100 border border-[#2069BA]/20 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#2069BA] mb-1">
            {user.points?.toLocaleString() || 0} Points
          </div>
          <div className="text-sm text-gray-600">
            = ${((user.points || 0) * 0.01).toFixed(2)} USD
          </div>
          {!canRedeem && (
            <div className="text-sm text-orange-600 mt-2">
              Need at least 2,000 points to redeem
            </div>
          )}
        </div>
      </div>

      {/* Gift Card Options */}
      {canRedeem && (
        <div className="mb-6">
          <h4 className="font-semibold text-[#2069BA] mb-3">
            Available Gift Cards
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GIFT_CARD_OPTIONS.map((giftCard, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                  selectedGiftCard === giftCard.name
                    ? "border-[#2069BA] bg-[#2069BA]/5"
                    : "border-gray-200 hover:border-[#2069BA]/30"
                }`}
                onClick={() => setSelectedGiftCard(giftCard.name)}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{giftCard.image}</div>
                  <div className="font-semibold text-gray-800 mb-1">
                    {giftCard.name}
                  </div>
                  <div className="text-lg font-bold text-green-600 mb-1">
                    ${giftCard.value}
                  </div>
                  <div className="text-sm text-gray-500">
                    {giftCard.points.toLocaleString()} points
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redemption Button */}
      {canRedeem && selectedGiftCard && (
        <div className="text-center">
          <button
            onClick={handleRedemption}
            disabled={isRedeeming}
            className="bg-[#2069BA] hover:bg-[#1e40af] text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRedeeming ? "Processing..." : "Redeem Gift Card"}
          </button>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4 text-green-500 font-bold">✓</div>
            <h3 className="text-xl font-bold text-[#2069BA] mb-2">
              Redemption Successful!
            </h3>
            <p className="text-gray-600 mb-4">
              Your gift card will be delivered to your email address within 24
              hours.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="bg-[#2069BA] hover:bg-[#1e40af] text-white px-6 py-2 rounded-lg"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Redemption Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-[#2069BA] mb-2">
          How Points Redemption Works
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Minimum redemption: 2,000 points ($20 gift card)</li>
          <li>• Gift cards are delivered to your registered email</li>
          <li>• Delivery time: 24-48 hours</li>
          <li>• Points are not redeemable for cash</li>
          <li>• Available platforms: Google Play, Apple App Store, Amazon</li>
        </ul>
      </div>
    </div>
  );
};

export default PointsRedemption;
