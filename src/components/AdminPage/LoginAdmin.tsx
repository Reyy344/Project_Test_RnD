import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiUser, FiArrowRight } from "react-icons/fi";

export const LoginAdmin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Login gagal.");
        return;
      }
      if (!data.token) {
        setMessage("Token autentikasi tidak diterima dari server.");
        return;
      }
      localStorage.setItem("cursor_admin_token", data.token);
      localStorage.setItem("cursor_admin_logged_in", "true");
      navigate("/admin", { replace: true });
    } catch {
      setMessage("Backend tidak dapat dihubungi. Pastikan server berjalan.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <p className="admin-eyebrow">CURSOR HUB / ADMIN</p>
        <h1>Login Admin</h1>
        <p className="login-desc">
          Masuk untuk mengelola kelas dan kehadiran CURSOR.
        </p>
        <form onSubmit={handleLogin}>
          <label>
            Username
            <div className="login-input-wrap">
              <FiUser />
              <input
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
              />
            </div>
          </label>
          <label>
            Password
            <div className="login-input-wrap">
              <FiLock />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>
          </label>
          {message && <p className="login-error">{message}</p>}
          <button className="admin-primary login-submit" disabled={loading}>
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}{" "}
            <FiArrowRight />
          </button>
        </form>
        <p className="login-foot">Akses terbatas untuk administrator.</p>
      </div>
    </main>
  );
};
