import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { db } from "@/config/Firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const ShippingAddress = () => {
  const { user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shippingData, setShippingData] = useState({
    fullName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phone: "",
    specialInstructions: "",
  });

  // ✅ Load existing shipping address if available
  useEffect(() => {
    const loadShippingAddress = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const docRef = doc(db, "shippingAddresses", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setShippingData(docSnap.data());
        }
      } catch (error) {
        console.error("Error loading shipping address:", error);

        // More specific error messages
        if (error.code === "permission-denied") {
          toast.error("Permission denied. Please check your authentication.");
        } else if (error.code === "unavailable") {
          toast.error("Service temporarily unavailable. Please try again.");
        } else if (error.code === "unauthenticated") {
          toast.error("Please login again to continue.");
        } else {
          toast.error(
            `Failed to load shipping address: ${
              error.message || "Unknown error"
            }`
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadShippingAddress();
  }, [user]);

  // ✅ Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Save shipping address
  const handleSaveAddress = async (e) => {
    e.preventDefault();

    // Debug: Log user information
    console.log("🔍 Debug - User object:", user);
    console.log("🔍 Debug - User UID:", user?.uid);
    console.log("🔍 Debug - User type:", user?.type);
    console.log("🔍 Debug - User email:", user?.email);

    if (!user) {
      toast.error("User not authenticated. Please login again.");
      return;
    }

    if (!userId) {
      toast.error("Invalid user ID. Please login again.");
      return;
    }

    try {
      setSaving(true);

      // Validate required fields
      const requiredFields = [
        "fullName",
        "streetAddress",
        "city",
        "state",
        "zipCode",
        "phone",
      ];
      const missingFields = requiredFields.filter(
        (field) => !shippingData[field]
      );

      if (missingFields.length > 0) {
        toast.error(`Please fill in: ${missingFields.join(", ")}`);
        return;
      }

      // Save to Firestore
      const docRef = doc(db, "shippingAddresses", userId);
      const dataToSave = {
        ...shippingData,
        userId: userId,
        updatedAt: new Date().toISOString(),
        status: "pending", // pending, shipped, delivered
        kitRequested: true,
      };

      console.log("🔍 Debug - Saving data:", dataToSave);
      console.log("🔍 Debug - User UID:", userId);

      await setDoc(docRef, dataToSave);

      toast.success("Shipping address saved successfully!");

      // Update local state
      setShippingData((prev) => ({
        ...prev,
        status: "pending",
        kitRequested: true,
      }));
    } catch (error) {
      console.error("Error saving shipping address:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Full error object:", error);

      // More specific error messages
      if (error.code === "permission-denied") {
        toast.error("Permission denied. Please check your authentication.");
        console.error(
          "🔍 Debug - This is a Firestore rules issue. Check your security rules."
        );
      } else if (error.code === "unavailable") {
        toast.error("Service temporarily unavailable. Please try again.");
      } else if (error.code === "unauthenticated") {
        toast.error("Please login again to continue.");
      } else {
        toast.error(
          `Failed to save shipping address: ${error.message || "Unknown error"}`
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Not Authenticated</h2>
        <p>Please login to access this feature.</p>
      </div>
    );
  }

  // Handle both old and new user structures
  const userRole = user.role || user.type;
  const userId = user.firebase_uid || user.uid;

  if (userRole !== "user") {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
        <p>Please login with a user account to access this feature.</p>
        <p className="text-sm text-gray-600 mt-2">
          Current user role: {userRole || "undefined"}
        </p>
        <p className="text-sm text-gray-600 mt-2">User UID: {userId}</p>
        <p className="text-sm text-gray-600 mt-2">User email: {user.email}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading shipping information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Shipping Address for DNA Kit
          </h2>
          <p className="text-gray-600">
            Provide your shipping address to receive your DNA collection kit.
            We'll ship it to you within 3-5 business days.
          </p>
        </div>

        {/* Status Banner */}
        {shippingData.status === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Kit Request Pending
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your DNA kit request has been submitted and is being
                    processed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {shippingData.status === "shipped" && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Kit Shipped
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Your DNA kit has been shipped and is on its way to you.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveAddress} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={shippingData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={shippingData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>

          {/* Street Address */}
          <div>
            <label
              htmlFor="streetAddress"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Street Address *
            </label>
            <input
              type="text"
              id="streetAddress"
              name="streetAddress"
              value={shippingData.streetAddress}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123 Main Street, Apt 4B"
              required
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={shippingData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New York"
                required
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                State/Province *
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={shippingData.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="NY"
                required
              />
            </div>

            <div>
              <label
                htmlFor="zipCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ZIP/Postal Code *
              </label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={shippingData.zipCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10001"
                required
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Country
            </label>
            <select
              id="country"
              name="country"
              value={shippingData.country}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="Italy">Italy</option>
              <option value="Spain">Spain</option>
              <option value="Netherlands">Netherlands</option>
              <option value="Belgium">Belgium</option>
              <option value="Switzerland">Switzerland</option>
              <option value="Austria">Austria</option>
              <option value="Sweden">Sweden</option>
              <option value="Norway">Norway</option>
              <option value="Denmark">Denmark</option>
              <option value="Finland">Finland</option>
              <option value="Poland">Poland</option>
              <option value="Czech Republic">Czech Republic</option>
              <option value="Hungary">Hungary</option>
              <option value="Slovakia">Slovakia</option>
              <option value="Slovenia">Slovenia</option>
              <option value="Croatia">Croatia</option>
              <option value="Serbia">Serbia</option>
              <option value="Bulgaria">Bulgaria</option>
              <option value="Romania">Romania</option>
              <option value="Greece">Greece</option>
              <option value="Portugal">Portugal</option>
              <option value="Ireland">Ireland</option>
              <option value="Iceland">Iceland</option>
              <option value="Luxembourg">Luxembourg</option>
              <option value="Malta">Malta</option>
              <option value="Cyprus">Cyprus</option>
              <option value="Estonia">Estonia</option>
              <option value="Latvia">Latvia</option>
              <option value="Lithuania">Lithuania</option>
              <option value="Australia">Australia</option>
              <option value="New Zealand">New Zealand</option>
              <option value="Japan">Japan</option>
              <option value="South Korea">South Korea</option>
              <option value="China">China</option>
              <option value="India">India</option>
              <option value="Singapore">Singapore</option>
              <option value="Malaysia">Malaysia</option>
              <option value="Thailand">Thailand</option>
              <option value="Vietnam">Vietnam</option>
              <option value="Philippines">Philippines</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Brazil">Brazil</option>
              <option value="Argentina">Argentina</option>
              <option value="Chile">Chile</option>
              <option value="Mexico">Mexico</option>
              <option value="Colombia">Colombia</option>
              <option value="Peru">Peru</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Uruguay">Uruguay</option>
              <option value="Paraguay">Paraguay</option>
              <option value="Ecuador">Ecuador</option>
              <option value="Bolivia">Bolivia</option>
              <option value="Guyana">Guyana</option>
              <option value="Suriname">Suriname</option>
              <option value="South Africa">South Africa</option>
              <option value="Egypt">Egypt</option>
              <option value="Morocco">Morocco</option>
              <option value="Tunisia">Tunisia</option>
              <option value="Algeria">Algeria</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Kenya">Kenya</option>
              <option value="Ghana">Ghana</option>
              <option value="Ethiopia">Ethiopia</option>
              <option value="Uganda">Uganda</option>
              <option value="Tanzania">Tanzania</option>
              <option value="Zimbabwe">Zimbabwe</option>
              <option value="Botswana">Botswana</option>
              <option value="Namibia">Namibia</option>
              <option value="Zambia">Zambia</option>
              <option value="Malawi">Malawi</option>
              <option value="Mozambique">Mozambique</option>
              <option value="Angola">Angola</option>
              <option value="Congo">Congo</option>
              <option value="Cameroon">Cameroon</option>
              <option value="Gabon">Gabon</option>
              <option value="Central African Republic">
                Central African Republic
              </option>
              <option value="Chad">Chad</option>
              <option value="Niger">Niger</option>
              <option value="Mali">Mali</option>
              <option value="Burkina Faso">Burkina Faso</option>
              <option value="Senegal">Senegal</option>
              <option value="Guinea">Guinea</option>
              <option value="Sierra Leone">Sierra Leone</option>
              <option value="Liberia">Liberia</option>
              <option value="Ivory Coast">Ivory Coast</option>
              <option value="Togo">Togo</option>
              <option value="Benin">Benin</option>
              <option value="Guinea-Bissau">Guinea-Bissau</option>
              <option value="The Gambia">The Gambia</option>
              <option value="Cape Verde">Cape Verde</option>
              <option value="Mauritania">Mauritania</option>
              <option value="Mauritius">Mauritius</option>
              <option value="Seychelles">Seychelles</option>
              <option value="Comoros">Comoros</option>
              <option value="Madagascar">Madagascar</option>
              <option value="Reunion">Reunion</option>
              <option value="Mayotte">Mayotte</option>
              <option value="Saint Helena">Saint Helena</option>
              <option value="Ascension Island">Ascension Island</option>
              <option value="Tristan da Cunha">Tristan da Cunha</option>
              <option value="Bouvet Island">Bouvet Island</option>
              <option value="Heard Island">Heard Island</option>
              <option value="McDonald Islands">McDonald Islands</option>
              <option value="French Southern Territories">
                French Southern Territories
              </option>
              <option value="South Georgia">South Georgia</option>
              <option value="South Sandwich Islands">
                South Sandwich Islands
              </option>
              <option value="Falkland Islands">Falkland Islands</option>
              <option value="Antarctica">Antarctica</option>
              <option value="Greenland">Greenland</option>
              <option value="Faroe Islands">Faroe Islands</option>
              <option value="Svalbard">Svalbard</option>
              <option value="Jan Mayen">Jan Mayen</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Special Instructions */}
          <div>
            <label
              htmlFor="specialInstructions"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Special Instructions (Optional)
            </label>
            <textarea
              id="specialInstructions"
              name="specialInstructions"
              value={shippingData.specialInstructions}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special delivery instructions, building access codes, etc."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
            >
              {saving ? "Saving..." : "Save Shipping Address"}
            </button>
          </div>
        </form>

        {/* Information Box */}
        <div className="mt-8 bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your shipping address will be verified</li>
            <li>
              • A DNA collection kit will be prepared and shipped within 3-5
              business days
            </li>
            <li>• You'll receive tracking information via email</li>
            <li>• The kit contains everything needed for sample collection</li>
            <li>• Return shipping label is included</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddress;
