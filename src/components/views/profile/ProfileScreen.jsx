import React, { useState, useCallback, useContext, useEffect, useRef } from "react";
import { Edit2, LogOut, Camera, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import { AuthContext } from "../../../context/authContextValue";
import api from "../../../services/api";

// Backend URL for images
const BACKEND_URL = "http://localhost:6969";

// Generate initials from name
const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Avatar component with initials fallback
const Avatar = ({ src, name, size = "large", onClick, showCamera = false }) => {
  const initials = getInitials(name);
  const sizeClasses = {
    small: "w-10 h-10 text-sm",
    medium: "w-24 h-24 text-2xl",
    large: "w-36 h-36 text-4xl"
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} rounded-full border-4 border-[#74CD25] shadow-lg overflow-hidden cursor-pointer group`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src.startsWith('http') ? src : `${BACKEND_URL}${src}`}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#74CD25] to-[#5fa01c] flex items-center justify-center text-white font-bold">
          {initials}
        </div>
      )}
      {showCamera && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-8 h-8 text-white" />
        </div>
      )}
    </div>
  );
};

export default function ProfileScreen() {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleEdit = useCallback(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setEditMode(true);
    setMessage({ type: "", text: "" });
  }, [user]);

  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.put('/profile', {
        name: form.name,
        phone: form.phone,
      });

      if (response.data.success) {
        setUser(response.data.data);
        setEditMode(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        setMessage({ type: "error", text: response.data.message || "Failed to update profile" });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile"
      });
    } finally {
      setSaving(false);
    }
  }, [form, setUser]);

  const handleCancel = useCallback(() => {
    setEditMode(false);
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setMessage({ type: "", text: "" });
  }, [user]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const handleImageClick = useCallback(() => {
    if (editMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [editMode]);

  const handleImageChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    setUploadingImage(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await api.post('/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUser(response.data.data);
        setMessage({ type: "success", text: "Profile image updated!" });
      }
    } catch (error) {
      console.error("Image upload error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to upload image"
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [setUser]);

  const handleDeleteImage = useCallback(async () => {
    if (!user?.profileImage) return;

    setUploadingImage(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.delete('/profile/image');

      if (response.data.success) {
        setUser(response.data.data);
        setMessage({ type: "success", text: "Profile image removed!" });
      }
    } catch (error) {
      console.error("Delete image error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete image"
      });
    } finally {
      setUploadingImage(false);
    }
  }, [user, setUser]);

  if (!user) {
    return (
      <PageLayout className="flex items-center justify-center py-12 px-4 bg-[#232428]">
        <div className="text-white">Loading user data...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="flex flex-col items-center py-12 px-4 bg-[#232428]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {/* Message Alert */}
      {message.text && (
        <div className={`w-full max-w-3xl mb-4 p-4 rounded-lg flex items-center justify-between ${message.type === "success"
          ? "bg-green-900/50 border border-green-500 text-green-300"
          : "bg-red-900/50 border border-red-500 text-red-300"
          }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: "", text: "" })} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!editMode ? (
        <>
          <h1 className="text-2xl font-bold text-white mb-6 w-full max-w-3xl">
            Welcome, {user.name || "User"}
          </h1>
          <div className="w-full max-w-3xl bg-[#343538] rounded-2xl shadow-xl p-8 flex flex-col md:flex-row items-center relative">
            {/* Edit Icon */}
            <button
              className="absolute top-5 right-16 p-2 rounded-full bg-[#232526] hover:bg-[#74CD25] transition group"
              title="Edit Profile"
              onClick={handleEdit}
            >
              <Edit2 className="w-5 h-5 text-[#74CD25] group-hover:text-white" />
            </button>

            {/* Logout Icon */}
            <button
              className="absolute top-5 right-5 p-2 rounded-full bg-[#232526] hover:bg-red-500 transition group"
              title="Logout"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 text-red-400 group-hover:text-white" />
            </button>

            {/* Avatar */}
            <div className="flex-shrink-0 flex flex-col items-center md:items-start md:mr-10 mb-6 md:mb-0">
              <Avatar
                src={user.profileImage}
                name={user.name}
                size="large"
              />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col items-center md:items-start">
              <h2 className="text-xl font-bold text-white mb-4">Personal Info</h2>

              <div className="text-gray-400 text-sm mb-1">Full Name</div>
              <div className="text-lg font-semibold text-white mb-3">{user.name || "-"}</div>

              <div className="text-gray-400 text-sm mb-1">Email</div>
              <div className="text-lg font-semibold text-[#74CD25] mb-3 break-all">
                {user.email}
              </div>

              <div className="text-gray-400 text-sm mb-1">Phone</div>
              <div className="text-lg font-semibold text-white mb-3">{user.phone || "-"}</div>

              <div className="flex gap-4 mt-4">
                <span className="inline-block px-4 py-1 rounded-full bg-[#232526] text-xs text-white font-semibold border border-[#343538]">
                  User ID: {user.id}
                </span>
                <span className="inline-block px-4 py-1 rounded-full bg-[#74CD25] text-xs text-white font-semibold border border-[#74CD25]">
                  Active
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-white mb-8 w-full max-w-3xl text-center md:text-left">
            Edit Profile
          </h1>
          <form
            className="w-full max-w-3xl bg-[#343538] rounded-2xl shadow-xl p-8 flex flex-col gap-8"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar & Upload */}
              <div className="flex flex-col items-center md:items-start min-w-[200px] md:w-1/3">
                <div className="relative">
                  <Avatar
                    src={user.profileImage}
                    name={user.name}
                    size="medium"
                    onClick={handleImageClick}
                    showCamera={true}
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleImageClick}
                    disabled={uploadingImage}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#74CD25] text-white text-xs font-semibold hover:bg-[#5fa01c] transition disabled:opacity-50"
                  >
                    <Camera className="w-3 h-3" />
                    Upload
                  </button>
                  {user.profileImage && (
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      disabled={uploadingImage}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="mt-4 text-center md:text-left">
                  <div className="text-lg font-bold text-white leading-tight">{user.name}</div>
                  <div className="text-xs text-gray-400 leading-tight">{user.email}</div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="flex-1 flex flex-col gap-4 w-full">
                <FormField
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
                <FormField
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={true}
                  hint="Email cannot be changed"
                />
                <FormField
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-[#232428] text-white font-semibold hover:bg-[#343538] transition text-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-10 py-2 rounded-lg bg-[#74CD25] text-white font-semibold hover:bg-[#5fa01c] transition text-lg shadow disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </PageLayout>
  );
}

// Reusable form field component
function FormField({ label, name, value, onChange, disabled = false, placeholder = "", hint = "" }) {
  return (
    <div>
      <label className="block text-gray-300 text-sm mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-lg px-3 py-2 bg-[#232428] text-white border border-[#232526] focus:outline-none focus:ring-2 focus:ring-[#74CD25] ${disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
