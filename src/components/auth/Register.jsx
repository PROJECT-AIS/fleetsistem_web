import React, { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validation, setValidation] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidation([]);

    try {
      const response = await api.post("/api/register", {
        name: name,
        email: email,
        password: password,
        phone: phone,
      });

      if (response.data.success) {
        setSuccess(true);
        // Wait a moment to show success message before redirect
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (error) {
      if (error.response?.data) {
        setValidation(error.response.data);
      } else {
        setValidation({ message: "An error occurred. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ backgroundColor: "#1E1F22" }}
    >
      {/* Left Side - Image Section */}
      <div className="flex-1 relative hidden md:block">
        {/* Background Image */}
        <img
          src="/assets/gambar_exca.png"
          alt="gambar exca"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-8 z-10">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 relative">
              <img
                src="/logo_ais.png"
                alt="Triangle Logo"
                className="w-full h-full"
              />
            </div>
            <span className="text-white text-xl font-bold">FMS</span>
          </div>

          {/* Welcome Text */}
          <div className="text-white">
            <h1 className="text-5xl font-bold mb-2">Welcome to</h1>
            <h2 className="text-4xl font-bold">Fleet Management System</h2>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20 z-10">
          <div className="w-full h-full border-4 border-white rounded-full"></div>
          <div className="absolute bottom-8 right-8 w-32 h-32 border-2 border-white rounded-full"></div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full md:w-96 p-8 flex flex-col justify-center relative">
        {/* Mobile logo */}
        <div className="flex items-center space-x-2 mb-8 md:hidden">
          <div className="w-8 h-8 relative">
            <img
              src="/logo_ais.png"
              alt="Triangle Logo"
              className="w-full h-full"
            />
          </div>
          <span className="text-white text-xl font-bold">FMS</span>
        </div>

        {/* Welcome Back */}
        <div className="mb-3">
          <h3 className="text-white text-3xl font-bold mb-1">Create your</h3>
          <h3 className="text-white text-3xl font-bold">account!</h3>
        </div>

        <div className="text-white mb-5">Enter your Full Details</div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-900/50 border border-green-500 text-green-300">
            <p className="text-sm font-medium">
              Registration successful! Redirecting to login...
            </p>
          </div>
        )}

        {/* Validation Errors */}
        {validation.errors && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-400 text-red-700">
            {validation.errors.map((error, index) => (
              <p key={index} className="text-sm font-medium">
                {error.msg}
              </p>
            ))}
          </div>
        )}
        {validation.message && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-400 text-red-700">
            <p className="text-sm font-medium">{validation.message}</p>
          </div>
        )}

        <form onSubmit={register}>
          {/* Register Form */}
          <div className="space-y-3">
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-lime-500 transition-colors"
                style={{ borderColor: name ? "#74CD25" : undefined }}
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-lime-500 transition-colors"
                style={{ borderColor: email ? "#74CD25" : undefined }}
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full pl-10 pr-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-lime-500 transition-colors"
                style={{ borderColor: phone ? "#74CD25" : undefined }}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-12 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-lime-500 transition-colors"
                  style={{ borderColor: password ? "#74CD25" : undefined }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Register Button */}
            <button
              className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: "#74CD25" }}
              type="submit"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : success ? (
                "Success!"
              ) : (
                "Register"
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <span className="text-white">Already have an account? </span>
              <button
                type="button"
                className="text-lime-500 hover:text-lime-400 transition-colors"
                onClick={() => navigate("/login")}
              >
                Log In
              </button>
            </div>
          </div>
        </form>

        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ backgroundColor: "#74CD25" }}
        ></div>
        <div
          className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ backgroundColor: "#74CD25" }}
        ></div>
        <div
          className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full opacity-30 pointer-events-none"
          style={{ backgroundColor: "#74CD25" }}
        ></div>
      </div>
    </div>
  );
}
