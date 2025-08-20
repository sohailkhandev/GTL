// purchase history page will show all history of point purchases of logged in institution

import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { db } from "@/config/Firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const PurchaseHistory = () => {
  const { user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const fetchedOrders = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            formattedCreatedAt: data.createdAt.toDate().toLocaleString(),
            formattedPaidAt: data.paidAt?.toDate().toLocaleString(),
            formattedExpiresAt: data.expiresAt?.toDate().toLocaleString(),
            amount: data.amount, // Assuming amount is in cents
          };
        });

        setOrders(fetchedOrders.reverse());
        setError(null);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  const getPlanDetails = (planId) => {
    const plans = {
      points_1000: { name: "1000 Points", description: "Basic points package" },
      points_5000: {
        name: "5000 Points",
        description: "Standard points package",
      },
      points_10000: {
        name: "10000 Points",
        description: "Premium points package",
      },
    };
    return plans[planId] || { name: planId, description: "Points package" };
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Please sign in to view your purchase history
          </h2>
          <p className="text-gray-600">
            You need to be logged in to access your order details.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
        <p className="mt-2 text-sm text-gray-600">
          View all your point purchases
        </p>
      </div>

      {/* Order Status Tabs */}
      <div className="border-b border-gray-200 mb-6 hidden">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "all"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "completed"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pending"
                ? "border-yellow-500 text-yellow-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "expired"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Expired
          </button>
        </nav>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No orders found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === "all"
                ? "You haven't made any purchases yet."
                : `You don't have any ${activeTab} orders.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const planDetails = getPlanDetails(order.planId);
            return (
              <div
                key={order.id}
                className="bg-white shadow overflow-hidden rounded-lg"
              >
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="mb-2 sm:mb-0">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Order #{order.paymentId.slice(-8)}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Purchased on {order.formattedCreatedAt}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-2/3">
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Purchase Details
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-start border-b border-gray-100 pb-4">
                          <div className="flex-shrink-0 h-20 w-20 rounded-md overflow-hidden bg-blue-50 flex items-center justify-center">
                            <svg
                              className="h-10 w-10 text-blue-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>{planDetails.name}</h3>
                              <p>${order.amount.toFixed(2)}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {planDetails.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="md:w-1/3 md:pl-8 mt-6 md:mt-0">
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Payment Information
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Payment ID</span>
                          <span className="font-mono">
                            {order.paymentId.slice(0, 8)}...
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Status</span>
                          <span className="capitalize">{order.status}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Paid At</span>
                          <span>{order.formattedPaidAt || "Not paid"}</span>
                        </div>
                        {order.expiresAt && (
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Expires At</span>
                            <span>{order.formattedExpiresAt}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between text-base font-medium text-gray-900">
                          <span>Total</span>
                          <span>${order.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;
