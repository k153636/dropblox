"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Feed from "@/components/Feed";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main content - shifted when sidebar open on desktop (Golden Ratio) */}
      <main 
        className={`transition-all duration-300 ${
          sidebarOpen ? "md:ml-[144px]" : "md:ml-[89px]"
        }`}
      >
        <div className="max-w-[676px] mx-auto px-[21px] py-[34px]">
          <Feed />
        </div>
      </main>
    </div>
  );
}
