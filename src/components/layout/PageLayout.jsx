/**
 * PageLayout Component
 * Wrapper component that provides consistent Header and SideBar layout
 */
import React from 'react';
import Header from '../utils/Header';
import SideBar from '../utils/sidebar/SideBar';

export default function PageLayout({ children, className = '' }) {
    return (
        <div className="min-h-screen text-white" style={{ backgroundColor: '#1E1F22' }}>
            <Header />
            <div className="flex">
                <SideBar />
                <main className={`flex-1 ${className}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}
