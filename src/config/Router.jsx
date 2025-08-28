// Router.jsx is responsible for handling all routes of pages in app

import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import ScrollToTop from "@/components/ScrollToTop";
import { useAppContext } from "@/context/AppContext";
import LoadingComponent from "../components/LoadingComponent";

// Public Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";

// User Pages
import ParticipateSurvey from "@/pages/User/ParticipateSurvey";
import MyActivity from "@/pages/User/MyActivity";
import Notifications from "@/pages/User/Notifications";
import MyPage from "@/pages/User/MyPage";
import ShippingAddress from "@/pages/User/ShippingAddress";
import Dashboard from "@/pages/User/Dashboard";

// Institution Pages
import InstitutionDashboard from "@/pages/Institution/Dashboard";
import SearchDatabase from "@/pages/Institution/SearchDatabase";
import SendProposals from "@/pages/Institution/SendProposals";
import LicensePayments from "@/pages/Institution/LicensePayments";
import BusinessSurveyBuilder from "@/pages/Institution/SurveyBuilder";
import SurveyResponses from "@/pages/Institution/SurveyResponses";

// Admin Pages
import AdminDashboard from "@/pages/Admin/Dashboard";
import UserManagement from "@/pages/Admin/UserManagement";
import BusinessManagement from "@/pages/Admin/InstitutionManagement";
import SurveyBuilder from "@/pages/Admin/SurveyBuilder";
import LicenseLogs from "@/pages/Admin/LicenseLogs";
import HowItWorks from "../pages/HowItWorks";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TermsOfServices from "../pages/TermsOfServices";
import VerifyEmail from "../pages/VerifyEmail";
import PurchaseHistory from "../pages/Institution/PurchaseHistory";
import PaymentSuccess from "../components/PaymentSuccess";

export default function AppRouter() {
  const { user, loading } = useAppContext();

  if (loading) {
    return <LoadingComponent />;
  } else {
    return (
      <BrowserRouter>
        <div className=" bg-gray-50 flex flex-col min-h-screen">
          <Navbar />
          <div className="container mx-auto p-4 flex-grow">
            <Routes>
              {/* Public Routes - Home is the default landing page */}
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfServices />} />
              <Route path="/verifyemail" element={<VerifyEmail />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />

              {/* User Routes */}
              <Route
                path="/dashboard"
                element={
                  user?.type === "user" ? (
                    <Dashboard />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/participate"
                element={
                  user?.type === "user" ? (
                    <ParticipateSurvey />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/activity"
                element={
                  user?.type === "user" ? (
                    <MyActivity />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/notifications"
                element={
                  user?.type === "user" ? (
                    <Notifications />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/mypage"
                element={user ? <MyPage /> : <Navigate to="/login" />}
              />
              <Route
                path="/shipping-address"
                element={
                  user?.type === "user" ? (
                    <ShippingAddress />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Business Routes */}
              <Route
                path="/business/dashboard"
                element={
                  user?.type === "business" ? (
                    <InstitutionDashboard />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/business/search"
                element={
                  user?.type === "business" ? (
                    <SearchDatabase />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/business/proposals"
                element={
                  user?.type === "business" ? (
                    <SendProposals />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/business/purchasehistory"
                element={
                  user?.type === "business" ? (
                    <PurchaseHistory />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/business/licenses"
                element={
                  user?.type === "business" ? (
                    <LicensePayments />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/business/surveys"
                element={
                  user?.type === "business" ? (
                    <BusinessSurveyBuilder />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/business/survey-responses"
                element={
                  user?.type === "business" ? (
                    <SurveyResponses />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/business/paymentsuccess"
                element={
                  user?.type === "business" ? (
                    <PaymentSuccess />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  user?.type === "admin" ? (
                    <AdminDashboard />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/admin/users"
                element={
                  user?.type === "admin" ? (
                    <UserManagement />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/admin/businesses"
                element={
                  user?.type === "admin" ? (
                    <BusinessManagement />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/admin/surveys"
                element={
                  user?.type === "admin" ? (
                    <SurveyBuilder />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/admin/licenses"
                element={
                  user?.type === "admin" ? (
                    <LicenseLogs />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </div>
        <ScrollToTop />
      </BrowserRouter>
    );
  }
}
