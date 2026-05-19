import { useState } from 'react'
import Sidebar from '../Navigation/Sidebar'
import Header from '../Navigation/Header'

export default function Layout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        toggleCollapse={toggleCollapse} 
        isCollapsed={isCollapsed} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          toggleMobileSidebar={toggleMobileSidebar} 
          isSidebarOpen={isMobileSidebarOpen} 
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={toggleMobileSidebar}
          className="fixed inset-0 z-20 bg-black/60 md:hidden backdrop-blur-sm"
        />
      )}
    </div>
  )
}
