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
        <div className="w-full h-full bg-gradient-to-br from-[#74CD25] to-[#5fa01c] flex items-center justify-center text-white font-bold text-sm">
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
      console.error('Logout error:', error);
      navigate("/login", { replace: true });
    }
  }, [authLogout, navigate]);

  const handleProfileClick = useCallback(() => {
    setShowDropdown(false);
    navigate('/profile');
  }, [navigate]);

  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  }, []);

  const profileMenu = [
    {
      label: 'Profile',
      onClick: handleProfileClick,
    },
    {
      label: 'Log Out',
      onClick: logout,
      className: 'text-red-400 hover:bg-gray-600',
    },
  ];

  // Get user display info
  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#2d2e32] border-b border-[#343538] relative">
      {/* Left: Logo */}
      <div className="flex items-center gap-4">
        <img src="/logo_ais.png" alt="Logo AIS" className="w-12 h-12 object-contain" />
      </div>

      {/* Center: Title */}
      <h1 className="text-xl font-bold text-white tracking-wide absolute left-1/2 -translate-x-1/2">
        PT ANUGRAH INTI SPEKTRA
      </h1>

      {/* Right: User Profile */}
      <div className="flex items-center gap-3 relative">
        {user ? (
          <>
            <SmallAvatar
              src={user.profileImage}
              name={user.name}
              onClick={toggleDropdown}
            />
            <div>
              <div className="text-sm font-semibold text-white leading-tight">{displayName}</div>
              <div className="text-xs text-gray-400 leading-tight">{displayEmail}</div>
            </div>
            <button
              onClick={toggleDropdown}
              className="ml-1 p-1 rounded hover:bg-gray-600 transition-colors"
              aria-label="Toggle user menu"
            >
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-14 right-0 mt-2 w-48 rounded-lg shadow-lg z-50 animate-slide-down"
                style={{ backgroundColor: "#343538" }}
              >
                <div className="p-3 border-b flex items-center gap-3" style={{ borderColor: "#4a4a4a" }}>
                  <SmallAvatar
                    src={user.profileImage}
                    name={user.name}
                  />
                  <div className="overflow-hidden">
                    <div className="text-sm font-medium text-white truncate">{displayName}</div>
                    <div className="text-xs text-gray-400 truncate">{displayEmail}</div>
                  </div>
                </div>
                <div className="p-2">
                  {profileMenu.map((item, idx) => (
                    <button
                      key={idx}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors duration-150 ${item.className || "text-white hover:bg-gray-600"
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
              onClick={() => navigate('/login')}
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
