import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("cursor_admin_logged_in");
    localStorage.removeItem("cursor_admin_token");
    navigate("/", { replace: true });
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="px-10 py-5 flex justify-between items-center p-4 bg-gray-800 text-white border-b-[0.2px] border-gray-600">
        <div className="text-2xl font-bold">
          <h1>Dashboard Admin</h1>
        </div>

        <div>
          <button onClick={handleLogout} className="cursor-pointer">
            <div className="flex items-center gap-2 border border-gray-200 text-white font-semibold py-2 px-4 rounded-[5px] hover:bg-gray-700 ">
              <FiLogOut /> Logout Admin
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};
