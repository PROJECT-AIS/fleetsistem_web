/**
 * PageLayout Component
 * Wrapper component that provides consistent Header and SideBar layout
 */
import React from 'react';
import Header from '../utils/Header';
import SideBar from '../utils/sidebar/SideBar';

export default function PageLayout({ children, className = '', noScroll = false }) {
    return (
        <div className="h-screen overflow-hidden text-white flex flex-col" style={{ backgroundColor: '#1E1F22' }}>
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <SideBar />
                <main className={`flex-1 flex flex-col min-h-0 relative ${noScroll ? 'overflow-hidden' : 'overflow-y-auto'} ${className}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}
