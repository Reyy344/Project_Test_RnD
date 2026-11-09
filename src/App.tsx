import { type ReactNode } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";

import { UserPage } from "./components/UserPage";
import { UserNavbar } from "./components/UserNavbar";
import { LoginAdmin } from "./components/AdminPage/LoginAdmin";
import { AdminPage } from "./components/AdminPage/AdminPage";
import { AdminNavbar } from "./components/AdminPage/AdminNavbar";

function Home() {
  return (
    <>
      <UserNavbar />
      <main className="pt-[6rem]">
        <UserPage />
      </main>
    </>
  );
}

function Admin() {
  return (
    <>
      <AdminNavbar />
      <main className="pt-[6rem]">
        <AdminPage />
      </main>
    </>
  );
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const isLoggedIn = Boolean(localStorage.getItem("cursor_admin_token"));

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/login",
      element: <LoginAdmin />,
    },
    {
      path: "/admin",
      element: (
        <RequireAdmin>
          <Admin />
        </RequireAdmin>
      ),
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
