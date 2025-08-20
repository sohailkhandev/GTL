// this is the page from where all types of user can manage his account

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const MyPage = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
    address: "",
    organizationType: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { user, updateAuthPassword, updateAuthProfile } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        email: user.email,
        phone: user.phone || "",
        password: "",
        newPassword: "",
        confirmPassword: "",
        address: user.address || "",
        organizationType: user.organizationType || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (userData.password === "") {
      alert("Please enter current password");
    } else {
      if (userData.newPassword == "" && userData.confirmPassword == "") {
        await updateAuthProfile(
          userData.name,
          userData.email,
          userData.phone,
          userData.password,
          userData.address,
          userData.organizationType
        );
        setSuccessMessage("Account updated successfully!");
        // setIsEditing(false);
        // setTimeout(() => setSuccessMessage(""), 3000);
        window.location.reload();
      } else {
        if (
          userData.newPassword &&
          userData.newPassword !== userData.confirmPassword
        ) {
          alert("New passwords don't match!");
          return;
        }

        await updateAuthProfile(
          userData.name,
          userData.email,
          userData.phone,
          userData.password,
          userData.address,
          userData.organizationType
        );
        await updateAuthPassword(userData.password, userData.newPassword);
        setSuccessMessage("Account updated successfully!");
        // setIsEditing(false);
        // setTimeout(() => setSuccessMessage(""), 3000);
        window.location.reload();
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">My Account</h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={userData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded">
                {userData.name || "Not provided"}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="p-2 bg-gray-50 rounded">{userData.email}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={userData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded">
                {userData.phone || "Not provided"}
              </div>
            )}
          </div>

          {user.type === "institution" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={userData.address}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded">
                    {userData.address}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Type
                </label>
                {isEditing ? (
                  <select
                    id="organizationType"
                    name="organizationType"
                    value={userData.organizationType}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  >
                    <option value="University">University</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Research Center">Research Center</option>
                    <option value="Biotech Company">Biotech Company</option>
                    <option value="Pharmaceutical">Pharmaceutical</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <div className="p-2 bg-gray-50 rounded">
                    {userData.organizationType}
                  </div>
                )}
              </div>
            </>
          )}

          {isEditing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={userData.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter current password to make changes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={userData.newPassword}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Leave blank to keep current"
                />
              </div>

              {userData.newPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={userData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Edit Profile
              </button>
              {/* <button
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Delete Account
              </button> */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPage;
