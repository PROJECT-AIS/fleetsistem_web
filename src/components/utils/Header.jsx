import React, { useState, useContext, useCallback } from "react";
import { ChevronDown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContextValue";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { resolveBackendUrl } from "../../config/apiConfig";

// Generate initials from name
const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Small avatar component with initials fallback
const SmallAvatar = ({ src, name, onClick }) => {
  const initials = getInitials(name);

  return (
    <div
      className="w-10 h-10 rounded-full border-2 border-[#74CD25] overflow-hidden cursor-pointer flex-shrink-0"
      onClick={onClick}
    >
      {src ? (
        <img
          src={resolveBackendUrl(src)}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#74CD25] text-sm font-bold text-white">
          {initials}
        </div>
      )}
    </div>
  );
};

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, logout: authLogout } = useContext(AuthContext);

  // Close dropdown handler
  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
  }, []);

  // Use custom hooks for click outside and escape key
  const dropdownRef = useClickOutside(closeDropdown, showDropdown);
  useEscapeKey(closeDropdown, showDropdown);

  const logout = useCallback(() => {
    try {
      authLogout();
      setShowDropdown(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login", { replace: true });
    }
  }, [authLogout, navigate]);

  const handleProfileClick = useCallback(() => {
    setShowDropdown(false);
    navigate("/profile");
  }, [navigate]);

  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  const profileMenu = [
    {
      label: "Profile",
      onClick: handleProfileClick,
    },
    {
      label: "Log Out",
      onClick: logout,
      className: "text-red-400 hover:bg-gray-600",
    },
  ];

  // Get user display info
  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";

  return (
    <div className="relative flex min-h-[74px] items-center justify-between border-b border-white/6 bg-[#2d2f34] px-6 py-3">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo_ais.png"
          alt="Logo AIS"
          className="h-10 w-10 object-contain"
        />
      </div>

      {/* Center: Title */}
      <h1 className="pointer-events-none absolute left-1/2 top-1/2 w-full max-w-[560px] -translate-x-1/2 -translate-y-1/2 px-24 text-center text-[18px] font-semibold tracking-[0.01em] text-white/95">
        PT ANUGRAH INTI SPEKTRA
      </h1>

      {/* Right: User Profile */}
      <div className="relative flex items-center gap-2.5">
        {user ? (
          <>
            <SmallAvatar
              src={user.profileImage}
              name={user.name}
              onClick={toggleDropdown}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight text-white">
                {displayName}
              </div>
              <div className="truncate text-xs leading-tight text-gray-400">
                {displayEmail}
              </div>
            </div>
            <button
              onClick={toggleDropdown}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/8 hover:text-white"
              aria-label="Toggle user menu"
            >
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute right-0 top-14 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/8 bg-[#343538] shadow-2xl animate-slide-down"
              >
                <div
                  className="flex items-center gap-3 border-b border-white/8 p-3"
                >
                  <SmallAvatar src={user.profileImage} name={user.name} />
                  <div className="overflow-hidden">
                    <div className="text-sm font-medium text-white truncate">
                      {displayName}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {displayEmail}
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  {profileMenu.map((item, idx) => (
                    <button
                      key={idx}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                        item.className || "text-white hover:bg-white/8"
                      }`}
                      onClick={item.onClick}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-gray-400" />
            <button
              onClick={() => navigate("/login")}
              className="text-white text-sm hover:text-[#74CD25] transition-colors"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
