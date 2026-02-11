import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

const DashboardLayout = ({ sidebarType = 'user' }) => {
    return (
        <div className="dashboard-layout">
            {/* Skip to main content link for keyboard accessibility */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            <Navbar />
            <div className="dashboard-content">
                <Sidebar type={sidebarType} />
                <main
                    id="main-content"
                    className="dashboard-main"
                    role="main"
                    tabIndex="-1"
                    aria-label="Main content"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;