import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './AppLayout.css';

const AppLayout = ({ hideFooter = false, variant = 'default', hideNavbar = false }) => {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (
        <div className={`app-layout app-layout--${variant}`}>
            {/* Skip to main content link for keyboard accessibility */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            {!hideNavbar && !isAuthPage && <Navbar />}
            <main
                id="main-content"
                className={`app-main ${isAuthPage ? 'app-main--auth' : ''}`}
                role="main"
                tabIndex="-1"
            >
                <Outlet />
            </main>
            {!hideFooter && <Footer />}
        </div>
    );
};

export default AppLayout;