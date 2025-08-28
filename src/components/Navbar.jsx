// Navbar component to show on top of every screen
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useAppContext } from "../context/AppContext";
import DangerButton from "./DangerButton";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { user, logOut } = useAppContext();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
      navigate("/login");
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold">
          <img src={logo} style={{ height: 40 }} />
        </Link>

        {/* Hamburger Button (Mobile) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-700 text-2xl focus:outline-none"
        >
          ☰
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-gray-700">
                Welcome, {user.name || user.email}
              </span>

              {user.type === "user" && (
                <>
                  <Link to="/dashboard" className="hover:underline">
                    Dashboard
                  </Link>
                  <Link to="/participate" className="hover:underline">
                    Participate
                  </Link>
                  <Link to="/activity" className="hover:underline">
                    My Activity
                  </Link>
                  <Link to="/shipping-address" className="hover:underline">
                    DNA Kit
                  </Link>
                  <Link to="/notifications" className="hover:underline">
                    Notifications
                  </Link>
                </>
              )}

              {user.type === "business" && (
                <>
                  <Link to="/business/dashboard" className="hover:underline">
                    Dashboard
                  </Link>
                  <Link to="/business/search" className="hover:underline">
                    Search
                  </Link>
                  <Link
                    to="/business/purchasehistory"
                    className="hover:underline"
                  >
                    Purchase History
                  </Link>
                  <Link to="/business/licenses" className="hover:underline">
                    Purchase Points
                  </Link>
                </>
              )}

              {user.type === "admin" && (
                <>
                  <Link to="/admin" className="hover:underline">
                    Dashboard
                  </Link>
                  <Link to="/admin/users" className="hover:underline">
                    Users
                  </Link>
                  <Link to="/admin/businesses" className="hover:underline">
                    Businesses
                  </Link>
                  <Link to="/admin/surveys" className="hover:underline">
                    Surveys
                  </Link>
                  <Link to="/admin/licenses" className="hover:underline">
                    Payments Logs
                  </Link>
                </>
              )}

              <Link to="/mypage" className="hover:underline">
                My Account
              </Link>
              <DangerButton onClick={handleLogout} isLoading={isLoggingOut}>
                Logout
              </DangerButton>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="text-[#2069BA] font-bold hover:text-[#1e40af] transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                to="/login"
                className="bg-[#2069BA] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1e40af] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-md">
          <div className="flex flex-col space-y-2 p-4">
            {user ? (
              <>
                <span className="text-gray-700">
                  Welcome, {user.name || user.email}
                </span>

                {user.type === "user" && (
                  <>
                    <Link onClick={() => setIsOpen(false)} to="/dashboard">
                      Dashboard
                    </Link>
                    <Link onClick={() => setIsOpen(false)} to="/participate">
                      Participate
                    </Link>
                    <Link onClick={() => setIsOpen(false)} to="/activity">
                      My Activity
                    </Link>
                    <Link onClick={() => setIsOpen(false)} to="/notifications">
                      Notifications
                    </Link>
                  </>
                )}

                {user.type === "business" && (
                  <>
                    <Link
                      onClick={() => setIsOpen(false)}
                      to="/business/dashboard"
                    >
                      Dashboard
                    </Link>
                    <Link
                      onClick={() => setIsOpen(false)}
                      to="/business/search"
                    >
                      Search
                    </Link>
                    <Link
                      to="/business/purchasehistory"
                      onClick={() => setIsOpen(false)}
                    >
                      Purchase History
                    </Link>
                    <Link
                      to="/business/licenses"
                      onClick={() => setIsOpen(false)}
                    >
                      Purchase Points
                    </Link>
                  </>
                )}

                {user.type === "admin" && (
                  <>
                    <Link onClick={() => setIsOpen(false)} to="/admin">
                      Dashboard
                    </Link>
                    <Link onClick={() => setIsOpen(false)} to="/admin/users">
                      Users
                    </Link>
                    <Link
                      onClick={() => setIsOpen(false)}
                      to="/admin/businesses"
                    >
                      Businesses
                    </Link>
                    <Link onClick={() => setIsOpen(false)} to="/admin/surveys">
                      Surveys
                    </Link>
                    <Link onClick={() => setIsOpen(false)} to="/admin/licenses">
                      Payment Logs
                    </Link>
                  </>
                )}

                <Link onClick={() => setIsOpen(false)} to="/mypage">
                  My Account
                </Link>
                <DangerButton
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                  loadingText="Logging out..."
                >
                  Logout
                </DangerButton>
              </>
            ) : (
              <>
                <Link
                  onClick={() => setIsOpen(false)}
                  to="/"
                  className="text-[#2069BA] font-bold"
                >
                  🏠 Home
                </Link>
                <Link
                  onClick={() => setIsOpen(false)}
                  to="/login"
                  className="bg-[#2069BA] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1e40af] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  🔐 Login
                </Link>
                <Link
                  onClick={() => setIsOpen(false)}
                  to="/register"
                  className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  ✨ Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
