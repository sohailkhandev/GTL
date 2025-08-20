// this is page where user notifications will get show about the requests

import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { db } from "@/config/Firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("unread");
  const { user } = useAppContext();

  useEffect(() => {
    if (user) {
      // Set up real-time listener for user's notifications
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userNotifications = [];
        querySnapshot.forEach((doc) => {
          userNotifications.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Sort by date (newest first)
        const sortedNotifications = userNotifications.sort(
          (a, b) => b.date.toDate() - a.date.toDate()
        );

        setNotifications(sortedNotifications);
      });

      // Clean up the listener when component unmounts
      return () => unsubscribe();
    }
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      // Update in Firebase
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });

      // Local state will update automatically via the onSnapshot listener
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    activeTab === "unread" ? !n.read : true
  );

  if (!user || user.type !== "user") {
    return <div className="text-center py-8">Please login as a user</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">Notifications</h2>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-4 py-2 font-medium ${
              activeTab === "unread"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-medium ${
              activeTab === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            All Notifications
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {activeTab === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${!notification.read ? "bg-blue-50" : ""}`}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {notification.date?.toDate().toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
