// registration page

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import CheckEmail from "../components/CheckEmail";
import MainButton from "../components/MainButton";

const Register = () => {
  const { createAccount } = useAppContext();
  const [userType, setUserType] = useState("user");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    organizationType: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailSend, setEmailSend] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (userType === "business") {
      if (!formData.organizationType)
        newErrors.organizationType = "Organization type is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true); // Set loading state to true

    try {
      // Save to localStorage
      if (userType === "user") {
        const newUser = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          createdAt: new Date().toISOString(),
          isActive: true,
          type: "user",
        };
        const response = await createAccount(newUser);
        if (!response.success) {
          toast.error("Sign Up Failed");
        } else {
          // navigate("/checkemail");
          setEmailSend(true);
        }
      } else {
        const newBusiness = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          organizationType: formData.organizationType,
          address: formData.address,
          createdAt: new Date().toISOString(),
          isActive: true,
          type: "business",
        };
        const response = await createAccount(newBusiness);
        if (!response.success) {
          toast.error("Sign Up Failed");
        } else {
          // navigate("/checkemail");
          setEmailSend(true);
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred during registration");
    } finally {
      setIsSubmitting(false); // Reset loading state regardless of outcome
    }
  };

  if (emailSend) {
    return <CheckEmail email={formData.email} password={formData.password} />;
  } else {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <a
              href="/login"
              className="text-[#2069BA] hover:text-[#1e40af] font-semibold"
            >
              sign in to existing account
            </a>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am registering as:
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setUserType("user")}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    userType === "user"
                      ? "bg-[#2069BA] text-white shadow-lg"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow-md"
                  }`}
                >
                  Individual User
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("business")}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    userType === "business"
                      ? "bg-[#2069BA] text-white shadow-lg"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow-md"
                  }`}
                >
                  Business
                </button>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  {userType === "user" ? "Full Name" : "Business Name"} *
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2069BA] focus:border-[#2069BA] sm:text-sm transition-all duration-200`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address *
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.email ? "border-red-300" : "border-gray-300"
                    } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2069BA] focus:border-[#2069BA] sm:text-sm transition-all duration-200`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password *
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.password ? "border-red-300" : "border-gray-300"
                      } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2069BA] focus:border-[#2069BA] sm:text-sm transition-all duration-200`}
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.password}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Password *
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.confirmPassword
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2069BA] focus:border-[#2069BA] sm:text-sm transition-all duration-200`}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2069BA] focus:border-[#2069BA] sm:text-sm transition-all duration-200"
                  />
                </div>
              </div>

              {userType === "business" && (
                <>
                  <div>
                    <label
                      htmlFor="organizationType"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Organization Type *
                    </label>
                    <div className="mt-1">
                      <select
                        id="organizationType"
                        name="organizationType"
                        value={formData.organizationType}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.organizationType
                            ? "border-red-300"
                            : "border-gray-300"
                        } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2069BA] focus:border-[#2069BA] sm:text-sm transition-all duration-200`}
                      >
                        <option value="">Select organization type</option>
                        <option value="University">University</option>
                        <option value="Hospital">Hospital</option>
                        <option value="Research Center">Research Center</option>
                        <option value="Biotech Company">Biotech Company</option>
                        <option value="Pharmaceutical">Pharmaceutical</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.organizationType && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.organizationType}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="address"
                        name="address"
                        rows="3"
                        value={formData.address}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2069BA] focus:border-[#2069BA] sm:text-sm transition-all duration-200"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-[#2069BA] focus:ring-[#2069BA] border-gray-300 rounded"
                  required
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-gray-900"
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-[#2069BA] hover:text-[#1e40af] font-semibold"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-[#2069BA] hover:text-[#1e40af] font-semibold"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              <div>
                <MainButton
                  isLoading={isSubmitting}
                  loadingText="Submitting..."
                >
                  Register
                </MainButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
};

export default Register;
