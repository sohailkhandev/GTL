// User points component which shows user points
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/Firebase"; // adjust your firebase path

const UserPoints = ({ user }) => {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setPoints(docSnap.data().points || 0);
      } else {
        setPoints(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 w-full mb-5">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-between">
        Your Points
        <span className="text-blue-600 font-bold">
          {loading ? "..." : points}
        </span>
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        Each search deducts <strong>1 point</strong>. Points remaining indicate
        how many searches you can make.
      </p>
    </div>
  );
};

export default UserPoints;
