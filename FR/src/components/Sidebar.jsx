import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, User, Settings,
    Users, FileText, BarChart3, Shield,
    ChevronLeft, Menu, GraduationCap, TrendingUp, Gift
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ type = 'user' }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();

    const userNavItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/lessons', icon: GraduationCap, label: 'Lessons' },
        { to: '/practice', icon: BookOpen, label: 'Practice' },
        { to: '/progress', icon: TrendingUp, label: 'Progress' },
        { to: '/resources', icon: Gift, label: 'My Resources' },
        { to: '/profile', icon: User, label: 'Profile' }
    ];

    const adminNavItems = [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/users', icon: Users, label: 'Users' },
        { to: '/admin/submissions', icon: FileText, label: 'Submissions' },
        { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/admin/settings', icon: Shield, label: 'Settings' }
    ];

    const navItems = type === 'admin' ? adminNavItems : userNavItems;

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="sidebar-mobile-toggle"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                <Menu size={24} />
            </button>

            {/* Sidebar */}
            <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''} ${isMobileOpen ? 'sidebar--mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.to;

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setIsMobileOpen(false)}
                            >
                                <Icon size={20} />
                                <span className="sidebar-nav-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;