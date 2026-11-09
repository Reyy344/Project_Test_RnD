// import React from "react";
import { RiAdminFill } from "react-icons/ri";

export const UserNavbar = () => {
  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50">
        <div className="px-10 py-5 flex justify-between items-center p-4 bg-gray-800 text-white border-b-[0.2px] border-gray-600">
          <div className="text-2xl font-bold">
            <h1>CURSOR Hub</h1>
          </div>

          <div>
            <a href="/login" className="cursor-pointer">
              <div className="flex items-center gap-2 border border-gray-200 text-white font-semibold py-2 px-4 rounded-[5px] hover:bg-gray-700 ">
                <RiAdminFill /> Login Admin
              </div>
            </a>
          </div>
        </div>
      </nav>
    </>
  );
};
