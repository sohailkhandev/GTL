// Navbar component to show on top of every screen
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useAppContext } from "../context/AppContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logOut } = useAppContext();

  const handleLogout = () => {
    logOut();
    navigate("/");
    setIsOpen(false);
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

              {user.type === "institution" && (
                <>
                  <Link to="/institution/dashboard" className="hover:underline">
                    Dashboard
                  </Link>
                  <Link to="/institution/search" className="hover:underline">
                    Search
                  </Link>
                  <Link
                    to="/institution/purchasehistory"
                    className="hover:underline"
                  >
                    Purchase History
                  </Link>
                  <Link to="/institution/licenses" className="hover:underline">
                    Purchase Points
                  </Link>
                </>
              )}

              {user.type === "admin" && (
                <>
                  <Link to="/admin/users" className="hover:underline">
                    Users
                  </Link>
                  <Link to="/admin/institutions" className="hover:underline">
                    Institutions
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
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">
                Login
              </Link>
              <Link to="/register" className="hover:underline">
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
                    <Link onClick={() => setIsOpen(false)} to="/participate">
                      Participate
                    </Link>
                    <Link onClick={() => setIsOpen(false)} to="/activity">
                      My Activity
                    </Link>
                    <Link
                      onClick={() => setIsOpen(false)}
                      to="/shipping-address"
                    >
                      DNA Kit
                    </Link>
                    <Link onClick={() => setIsOpen(false)} to="/notifications">
                      Notifications
                    </Link>
                  </>
                )}

                {user.type === "institution" && (
                  <>
                    <Link
                      onClick={() => setIsOpen(false)}
                      to="/institution/dashboard"
                    >
                      Dashboard
                    </Link>
                    <Link
                      onClick={() => setIsOpen(false)}
                      to="/institution/search"
                    >
                      Search
                    </Link>
                    <Link
                      to="/institution/purchasehistory"
                      onClick={() => setIsOpen(false)}
                    >
                      Purchase History
                    </Link>
                    <Link
                      to="/institution/licenses"
                      onClick={() => setIsOpen(false)}
                    >
                      Purchase Points
                    </Link>
                  </>
                )}

                {user.type === "admin" && (
                  <>
                    <Link onClick={() => setIsOpen(false)} to="/admin/users">
                      Users
                    </Link>
                    <Link
                      onClick={() => setIsOpen(false)}
                      to="/admin/institutions"
                    >
                      Institutions
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
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link onClick={() => setIsOpen(false)} to="/login">
                  Login
                </Link>
                <Link onClick={() => setIsOpen(false)} to="/register">
                  Register
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
