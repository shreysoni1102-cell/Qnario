import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }

            // Scroll reveal animation
            document.querySelectorAll(".landing-reveal").forEach(el => {
                const top = el.getBoundingClientRect().top;
                if (top < window.innerHeight - 100) {
                    el.classList.add("active");
                }
            });
        };

        window.addEventListener("scroll", handleScroll);
        // Trigger once initially
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const enterApp = () => {
        navigate('/role-selection');
    };

    return (
        <div className="landing-page-wrapper">
            {/* Animated Cosmic Grid Backdrop */}
            <div className="landing-bg-wrapper">
                <div className="landing-gradient-mesh"></div>
                <div className="landing-grid-overlay"></div>
            </div>

            {/* Navbar */}
            <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
                <div className="landing-logo" onClick={() => navigate('/')}>QNARIO</div>
                <button className="landing-nav-btn" onClick={enterApp}>Launch</button>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <h1 className="landing-hero-title">Redefining Question Paper Generation</h1>
                <p className="landing-hero-desc">
                    QNARIO is an intelligent academic platform enabling structured
                    question paper generation, role-based dashboards, and
                    performance analytics for institutions.
                </p>
                <button className="landing-cta-btn" onClick={enterApp}>Enter Platform</button>
            </section>

            {/* Features Section */}
            <section className="landing-section landing-reveal">
                <h2 className="landing-section-title">Why QNARIO?</h2>
                <div className="landing-features-grid">
                    <div className="landing-feature-card">
                        <h3 className="landing-feature-header">Smart Paper Generation</h3>
                        <p className="landing-feature-body">Generate structured and balanced question papers instantly based on chapters.</p>
                    </div>
                    <div className="landing-feature-card">
                        <h3 className="landing-feature-header">Student Analytics</h3>
                        <p className="landing-feature-body">Track performance, accuracy, and exam statistics in real-time with cosmic diagrams.</p>
                    </div>
                    <div className="landing-feature-card">
                        <h3 className="landing-feature-header">Role-Based System</h3>
                        <p className="landing-feature-body">Separate custom dashboards for students, teachers, and system administrators.</p>
                    </div>
                    <div className="landing-feature-card">
                        <h3 className="landing-feature-header">Secure & Efficient</h3>
                        <p className="landing-feature-body">Real-time socket proctoring sync, anti-cheat enforcement, and local backup persistency.</p>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="landing-final-cta landing-reveal">
                <h2 className="landing-final-title">Experience Smarter Examination Management</h2>
                <button className="landing-final-btn" onClick={enterApp}>Get Started</button>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-footer-container">
                    <div className="landing-footer-brand">
                        <h3 className="landing-footer-brand-title">QNARIO</h3>
                        <p className="landing-footer-brand-desc">
                            Intelligent Question Paper Generation & Academic
                            Analytics Platform built for modern institutions.
                        </p>
                    </div>

                    <div className="landing-footer-columns">
                        <div className="landing-footer-col">
                            <h4>Product</h4>
                            <a href="#" onClick={(e) => e.preventDefault()}>Paper Generator</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Student Dashboard</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Analytics Reports</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Role Management</a>
                        </div>

                        <div className="landing-footer-col">
                            <h4>Features</h4>
                            <a href="#" onClick={(e) => e.preventDefault()}>Smart Distribution</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Performance Tracking</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Secure Storage</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Exam Monitoring</a>
                        </div>

                        <div className="landing-footer-col">
                            <h4>Resources</h4>
                            <a href="#" onClick={(e) => e.preventDefault()}>Documentation</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Support</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Release Notes</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>System Status</a>
                        </div>

                        <div className="landing-footer-col">
                            <h4>Company</h4>
                            <a href="#" onClick={(e) => e.preventDefault()}>About</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Contact</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                        </div>
                    </div>

                    <div className="landing-footer-bottom">
                        © 2026 QNARIO. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
