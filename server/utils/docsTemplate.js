const getDocsHTML = (port, activeRoomsCount) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Qnario Core API Specifications</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #050518;
            --card-bg: rgba(13, 13, 35, 0.45);
            --card-border: rgba(255, 255, 255, 0.08);
            --primary-glow: rgba(99, 102, 241, 0.15);
            --secondary-glow: rgba(168, 85, 247, 0.15);
            --text-main: #f1f5f9;
            --text-muted: #94a3b8;
            --color-get: #06b6d4;
            --color-post: #10b981;
            --color-put: #f59e0b;
            --color-patch: #a855f7;
            --color-delete: #ef4444;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            overflow-x: hidden;
            background-image: 
                radial-gradient(at 10% 20%, rgba(99, 102, 241, 0.1) 0px, transparent 50%),
                radial-gradient(at 90% 80%, rgba(168, 85, 247, 0.1) 0px, transparent 50%);
            background-attachment: fixed;
        }

        /* Ambient Glowing Aura Backgrounds */
        .cosmic-orb {
            position: fixed;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            filter: blur(150px);
            z-index: -1;
            pointer-events: none;
            opacity: 0.5;
        }
        .orb-1 {
            top: -100px;
            left: -100px;
            background: rgba(99, 102, 241, 0.3);
        }
        .orb-2 {
            bottom: -150px;
            right: -150px;
            background: rgba(168, 85, 247, 0.3);
        }

        /* Glassmorphism Header */
        header {
            position: sticky;
            top: 0;
            z-index: 100;
            background: rgba(8, 8, 28, 0.65);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            border-bottom: 1px solid var(--card-border);
            padding: 1.25rem 2.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .logo-symbol {
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 1.25rem;
            color: #fff;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
            animation: pulse 3s infinite alternate;
        }

        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); }
            100% { transform: scale(1.05); box-shadow: 0 0 25px rgba(168, 85, 247, 0.6); }
        }

        .logo-text {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(to right, #e2e8f0, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .header-status {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        .status-badge {
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #34d399;
            padding: 0.35rem 0.85rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 10px #10b981;
            display: inline-block;
        }

        /* Container & Navigation Layout */
        .app-container {
            display: grid;
            grid-template-columns: 300px 1fr;
            min-height: calc(100vh - 78px);
        }

        /* Sidebar navigation */
        aside {
            border-right: 1px solid var(--card-border);
            background: rgba(5, 5, 24, 0.3);
            padding: 2rem 1.5rem;
            position: sticky;
            top: 78px;
            height: calc(100vh - 78px);
            overflow-y: auto;
        }

        .nav-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.1rem;
            color: var(--text-muted);
            margin-bottom: 1.25rem;
            font-weight: 700;
        }

        .nav-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .nav-item button {
            width: 100%;
            text-align: left;
            background: transparent;
            border: none;
            color: var(--text-muted);
            padding: 0.75rem 1rem;
            border-radius: 10px;
            cursor: pointer;
            font-size: 0.92rem;
            font-weight: 500;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .nav-item button:hover, .nav-item.active button {
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-main);
            transform: translateX(5px);
        }

        .nav-item.active button {
            border-left: 3px solid #6366f1;
            background: rgba(99, 102, 241, 0.08);
            padding-left: 0.75rem;
        }

        /* Main Workspace Content */
        main {
            padding: 2.5rem;
            max-width: 1200px;
            width: 100%;
            margin: 0 auto;
            overflow-y: auto;
        }

        .welcome-hero {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 24px;
            padding: 2.5rem;
            margin-bottom: 2.5rem;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .welcome-hero h1 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.25rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            background: linear-gradient(135deg, #fff 30%, #a855f7 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .welcome-hero p {
            color: var(--text-muted);
            line-height: 1.6;
            font-size: 1.05rem;
            margin-bottom: 1.5rem;
        }

        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.25rem;
        }

        .metric-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            padding: 1.25rem;
            text-align: center;
        }

        .metric-val {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.75rem;
            font-weight: 700;
            color: #a855f7;
            margin-bottom: 0.25rem;
        }

        .metric-lbl {
            color: var(--text-muted);
            font-size: 0.85rem;
            font-weight: 500;
        }

        /* Endpoints section card view */
        .section-container {
            display: none;
            flex-direction: column;
            gap: 2rem;
            animation: fadeIn 0.4s ease forwards;
        }

        .section-container.active {
            display: flex;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .section-header-info {
            margin-bottom: 1rem;
        }

        .section-header-info h2 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .section-header-info p {
            color: var(--text-muted);
            line-height: 1.5;
        }

        /* Endpoint Card */
        .api-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 20px;
            padding: 1.5rem 2rem;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .api-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            transition: all 0.3s ease;
        }

        .api-card.get::before { background-color: var(--color-get); }
        .api-card.post::before { background-color: var(--color-post); }
        .api-card.put::before { background-color: var(--color-put); }
        .api-card.patch::before { background-color: var(--color-patch); }
        .api-card.delete::before { background-color: var(--color-delete); }

        .api-card:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.16);
            box-shadow: 0 8px 30px rgba(99, 102, 241, 0.08);
        }

        .api-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.75rem;
            flex-wrap: wrap;
        }

        .method-badge {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 0.85rem;
            padding: 0.35rem 0.85rem;
            border-radius: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05rem;
            color: #fff;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        }

        .get .method-badge { background-color: rgba(6, 182, 212, 0.2); border: 1px solid var(--color-get); color: var(--color-get); }
        .post .method-badge { background-color: rgba(16, 185, 129, 0.2); border: 1px solid var(--color-post); color: var(--color-post); }
        .put .method-badge { background-color: rgba(245, 158, 11, 0.2); border: 1px solid var(--color-put); color: var(--color-put); }
        .patch .method-badge { background-color: rgba(168, 85, 247, 0.2); border: 1px solid var(--color-patch); color: var(--color-patch); }
        .delete .method-badge { background-color: rgba(239, 68, 68, 0.2); border: 1px solid var(--color-delete); color: var(--color-delete); }

        .api-route {
            font-family: monospace;
            font-size: 1.1rem;
            font-weight: 600;
            color: #fff;
            background: rgba(255, 255, 255, 0.04);
            padding: 0.25rem 0.65rem;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .auth-needed {
            font-size: 0.8rem;
            font-weight: 500;
            padding: 0.25rem 0.65rem;
            border-radius: 20px;
            background: rgba(245, 158, 11, 0.08);
            border: 1px solid rgba(245, 158, 11, 0.25);
            color: #fbbf24;
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        .no-auth {
            font-size: 0.8rem;
            font-weight: 500;
            padding: 0.25rem 0.65rem;
            border-radius: 20px;
            background: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.25);
            color: #34d399;
        }

        .api-summary {
            font-size: 1.15rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-main);
        }

        .api-description {
            font-size: 0.95rem;
            color: var(--text-muted);
            line-height: 1.5;
            margin-bottom: 1.25rem;
        }

        /* Detail collapsible blocks */
        .details-trigger {
            background: transparent;
            border: none;
            color: #6366f1;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: color 0.3s;
            margin-bottom: 1rem;
        }

        .details-trigger:hover {
            color: #a855f7;
        }

        .details-body {
            display: none;
            flex-direction: column;
            gap: 1.25rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            animation: expandDown 0.3s ease-out forwards;
        }

        .details-body.open {
            display: flex;
        }

        @keyframes expandDown {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .detail-block-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 0.9rem;
            font-weight: 700;
            color: #e2e8f0;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        /* JSON formatting */
        pre {
            background: rgba(3, 3, 10, 0.6);
            border: 1px solid var(--card-border);
            border-radius: 12px;
            padding: 1.25rem;
            color: #51b8fe;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.88rem;
            overflow-x: auto;
            position: relative;
        }

        .json-key { color: #f43f5e; }
        .json-string { color: #34d399; }
        .json-num { color: #f59e0b; }
        .json-bool { color: #a855f7; }

        .copy-btn {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid var(--card-border);
            color: var(--text-muted);
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .copy-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
        }

        /* Utility Parameters Table */
        .params-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
        }

        .params-table th, .params-table td {
            text-align: left;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 0.9rem;
        }

        .params-table th {
            font-family: 'Space Grotesk', sans-serif;
            color: #e2e8f0;
            background: rgba(255, 255, 255, 0.02);
            font-weight: 700;
        }

        .param-name {
            font-family: monospace;
            font-weight: 600;
            color: #34d399;
        }

        .param-type {
            font-size: 0.8rem;
            color: #f59e0b;
        }

        .param-req {
            font-size: 0.75rem;
            color: #ef4444;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.2);
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
        }

        .param-opt {
            font-size: 0.75rem;
            color: var(--text-muted);
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--card-border);
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
        }

        /* Footer */
        footer {
            border-top: 1px solid var(--card-border);
            padding: 2.5rem;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.9rem;
            background: rgba(5, 5, 20, 0.5);
            margin-top: 5rem;
        }
    </style>
</head>
<body>
    <div class="cosmic-orb orb-1"></div>
    <div class="cosmic-orb orb-2"></div>

    <header>
        <div class="header-logo">
            <div class="logo-symbol">Q</div>
            <span class="logo-text">Qnario Core API API</span>
        </div>
        <div class="header-status">
            <div class="status-badge">
                <span class="status-dot"></span>
                API Server: Live (Port ${port})
            </div>
        </div>
    </header>

    <div class="app-container">
        <aside>
            <h3 class="nav-title">Categories</h3>
            <ul class="nav-list">
                <li class="nav-item active" data-section="overview"><button>Overview ➔</button></li>
                <li class="nav-item" data-section="auth"><button>Authentication & Users ➔</button></li>
                <li class="nav-item" data-section="exams"><button>Exams & Bank ➔</button></li>
                <li class="nav-item" data-section="attempts"><button>Attempts & Analytics ➔</button></li>
                <li class="nav-item" data-section="syllabus"><button>Syllabus & AI Generator ➔</button></li>
                <li class="nav-item" data-section="proctoring"><button>Live Proctoring Rooms ➔</button></li>
            </ul>
        </aside>

        <main>
            <!-- 1. Overview Section -->
            <section id="sect-overview" class="section-container active">
                <div class="welcome-hero">
                    <h1>Qnario Ecosystem REST API</h1>
                    <p>Welcome to the structured, production-grade API documentation of the **Qnario** AI-Powered exam platform. This API provides highly secure endpoints with multi-role access controls (Student, Teacher, Admin), rate limiting protections, integrated Gemini flash AI content scanning capabilities, and synchronized live exam proctoring synchronization hooks.</p>
                    <div class="metric-grid">
                        <div class="metric-card">
                            <div class="metric-val">Node.js / Express</div>
                            <div class="metric-lbl">API Service Core</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-val">FastAPI</div>
                            <div class="metric-lbl">AI Generator Microservice</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-val">${activeRoomsCount}</div>
                            <div class="metric-lbl">Active Proctoring Rooms</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-val">Mongoose (10 Schemas)</div>
                            <div class="metric-lbl">Persistent Storage Layer</div>
                        </div>
                    </div>
                </div>

                <div class="section-header-info">
                    <h2>Global Guidelines</h2>
                    <p style="margin-top: 0.5rem; line-height: 1.6; color: var(--text-muted);">
                        - All endpoints are prefixed with <code>/api</code>.<br/>
                        - Authentication is session-based and secured via secure <b>HTTP-only Cookies</b> containing the JWT token.<br/>
                        - Request bodies must be formatted as <code>application/json</code> unless specified otherwise (e.g., Multipart uploads for syllabus files).<br/>
                        - Global Rate Limit: 100 requests per 15 minutes per IP.
                    </p>
                </div>
            </section>

            <!-- 2. Auth & Users Section -->
            <section id="sect-auth" class="section-container">
                <div class="section-header-info">
                    <h2>Authentication & User Administration</h2>
                    <p>Verify identities, issue JWT tokens securely via cookie-headers, manage profile queries, and execute password recovery flows.</p>
                </div>

                <!-- Signup -->
                <div class="api-card post">
                    <div class="api-meta">
                        <span class="method-badge">POST</span>
                        <span class="api-route">/api/auth/signup</span>
                        <span class="no-auth">Public Endpoint</span>
                    </div>
                    <div class="api-summary">Create standard user account</div>
                    <p class="api-description">Registers a new account. Standard rate limiting restricts submissions to prevent brute registrations.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Request Body Parameters</div>
                        <table class="params-table">
                            <thead>
                                <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
                            </thead>
                            <tbody>
                                <tr><td class="param-name">name</td><td class="param-type">String</td><td><span class="param-req">required</span></td><td>Full legal name of the user.</td></tr>
                                <tr><td class="param-name">email</td><td class="param-type">String</td><td><span class="param-req">required</span></td><td>Must be a unique valid email address.</td></tr>
                                <tr><td class="param-name">password</td><td class="param-type">String</td><td><span class="param-req">required</span></td><td>Minimum of 6 characters in length.</td></tr>
                                <tr><td class="param-name">role</td><td class="param-type">String</td><td><span class="param-req">required</span></td><td>Enum choice of <code>student</code>, <code>teacher</code>, or <code>admin</code>.</td></tr>
                            </tbody>
                        </table>
                        <div class="detail-block-title">Example Response (201 Created)</div>
                        <pre><button class="copy-btn" onclick="copyCode(this)">Copy</button><span class="json-key">"success"</span>: <span class="json-bool">true</span>,
<span class="json-key">"message"</span>: <span class="json-string">"Account created successfully. Please verify your email."</span>,
<span class="json-key">"user"</span>: {
    <span class="json-key">"id"</span>: <span class="json-string">"64f2ad3569fb2001bb97cc02"</span>,
    <span class="json-key">"name"</span>: <span class="json-string">"Alex Mercer"</span>,
    <span class="json-key">"email"</span>: <span class="json-string">"student@qnario.com"</span>,
    <span class="json-key">"role"</span>: <span class="json-string">"student"</span>
}</pre>
                    </div>
                </div>

                <!-- Login -->
                <div class="api-card post">
                    <div class="api-meta">
                        <span class="method-badge">POST</span>
                        <span class="api-route">/api/auth/login</span>
                        <span class="no-auth">Public Endpoint</span>
                    </div>
                    <div class="api-summary">Log in and establish session</div>
                    <p class="api-description">Validates login credentials and returns a secure JWT token inside an <b>HTTP-only Cookie</b> named <code>token</code>.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Request Body Parameters</div>
                        <table class="params-table">
                            <thead>
                                <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
                            </thead>
                            <tbody>
                                <tr><td class="param-name">email</td><td class="param-type">String</td><td><span class="param-req">required</span></td><td>Registered email address.</td></tr>
                                <tr><td class="param-name">password</td><td class="param-type">String</td><td><span class="param-req">required</span></td><td>Account password.</td></tr>
                            </tbody>
                        </table>
                        <div class="detail-block-title">Response Header</div>
                        <pre>Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; Secure; SameSite=Strict</pre>
                    </div>
                </div>

                <!-- Profile -->
                <div class="api-card get">
                    <div class="api-meta">
                        <span class="method-badge">GET</span>
                        <span class="api-route">/api/auth/profile</span>
                        <span class="auth-needed">🔒 Token Cookie Required</span>
                    </div>
                    <div class="api-summary">Fetch current session profile</div>
                    <p class="api-description">Retrieves details of the user matching the validated JWT cookie session.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Response Template (200 OK)</div>
                        <pre><span class="json-key">"success"</span>: <span class="json-bool">true</span>,
<span class="json-key">"user"</span>: {
    <span class="json-key">"id"</span>: <span class="json-string">"64f2ad3569fb2001bb97cc02"</span>,
    <span class="json-key">"name"</span>: <span class="json-string">"Alex Mercer"</span>,
    <span class="json-key">"email"</span>: <span class="json-string">"student@qnario.com"</span>,
    <span class="json-key">"role"</span>: <span class="json-string">"student"</span>,
    <span class="json-key">"isEmailVerified"</span>: <span class="json-bool">true</span>
}</pre>
                    </div>
                </div>
            </section>

            <!-- 3. Exams & Bank Section -->
            <section id="sect-exams" class="section-container">
                <div class="section-header-info">
                    <h2>Exams & Question Bank Layer</h2>
                    <p>Retrieve listed examination standards (JEE, NEET, Board), subjects breakdowns, and administer the universal question repository.</p>
                </div>

                <!-- List Exams -->
                <div class="api-card get">
                    <div class="api-meta">
                        <span class="method-badge">GET</span>
                        <span class="api-route">/api/exams</span>
                        <span class="no-auth">Public Endpoint</span>
                    </div>
                    <div class="api-summary">List all academic exams</div>
                    <p class="api-description">Fetches details of all standard exams stored in the persistent database structure.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Response Template (200 OK)</div>
                        <pre><span class="json-key">"success"</span>: <span class="json-bool">true</span>,
<span class="json-key">"exams"</span>: [
    {
        <span class="json-key">"id"</span>: <span class="json-string">"64f2ad3569fb2001bb97cc10"</span>,
        <span class="json-key">"name"</span>: <span class="json-string">"JEE Main"</span>,
        <span class="json-key">"code"</span>: <span class="json-string">"jee_main"</span>,
        <span class="json-key">"examDetails"</span>: {
            <span class="json-key">"totalDuration"</span>: <span class="json-num">180</span>,
            <span class="json-key">"totalQuestions"</span>: <span class="json-num">75</span>,
            <span class="json-key">"totalMarks"</span>: <span class="json-num">300</span>,
            <span class="json-key">"negativeMarking"</span>: <span class="json-bool">true</span>
        }
    }
]</pre>
                    </div>
                </div>

                <!-- Create Question -->
                <div class="api-card post">
                    <div class="api-meta">
                        <span class="method-badge">POST</span>
                        <span class="api-route">/api/questions</span>
                        <span class="auth-needed">🔒 Teacher or Admin Required</span>
                    </div>
                    <div class="api-summary">Append a question to bank</div>
                    <p class="api-description">Creates a new MCQ or descriptive question manually inside the categorized question bank database.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Request Body Schema</div>
                        <pre>{
    <span class="json-key">"text"</span>: <span class="json-string">"Which molecule displays hybrid sp² structures?"</span>,
    <span class="json-key">"type"</span>: <span class="json-string">"MCQ"</span>,
    <span class="json-key">"marks"</span>: <span class="json-num">4</span>,
    <span class="json-key">"examId"</span>: <span class="json-string">"64f2ad3569fb2001bb97cc10"</span>,
    <span class="json-key">"examName"</span>: <span class="json-string">"JEE Main"</span>,
    <span class="json-key">"subjectName"</span>: <span class="json-string">"Chemistry"</span>,
    <span class="json-key">"difficulty"</span>: <span class="json-string">"Medium"</span>,
    <span class="json-key">"options"</span>: [
        { <span class="json-key">"id"</span>: <span class="json-string">"A"</span>, <span class="json-key">"text"</span>: <span class="json-string">"C2H4"</span> },
        { <span class="json-key">"id"</span>: <span class="json-string">"B"</span>, <span class="json-key">"text"</span>: <span class="json-string">"C2H2"</span> },
        { <span class="json-key">"id"</span>: <span class="json-string">"C"</span>, <span class="json-key">"text"</span>: <span class="json-string">"CH4"</span> },
        { <span class="json-key">"id"</span>: <span class="json-string">"D"</span>, <span class="json-key">"text"</span>: <span class="json-string">"H2O"</span> }
    ],
    <span class="json-key">"answer"</span>: {
        <span class="json-key">"correctOption"</span>: <span class="json-string">"A"</span>,
        <span class="json-key">"explanation"</span>: <span class="json-string">"Ethylene has a carbon double bond displaying sp² hybridization."</span>
    }
}</pre>
                    </div>
                </div>
            </section>

            <!-- 4. Attempts & Analytics Section -->
            <section id="sect-attempts" class="section-container">
                <div class="section-header-info">
                    <h2>Attempts & Analytics Engine</h2>
                    <p>Track student performance metrics, persist quiz reviews, calculate pass rates, and load overall statistics dashboard grids.</p>
                </div>

                <!-- Submit Attempt -->
                <div class="api-card post">
                    <div class="api-meta">
                        <span class="method-badge">POST</span>
                        <span class="api-route">/api/attempts/submit</span>
                        <span class="auth-needed">🔒 Student Token Cookie Required</span>
                    </div>
                    <div class="api-summary">Log an exam attempt</div>
                    <p class="api-description">Submits an completed exam paper, evaluates correctness against answers, and records progress attempts.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Request Body Schema</div>
                        <pre>{
    <span class="json-key">"examId"</span>: <span class="json-string">"64f2ad3569fb2001bb97cc10"</span>,
    <span class="json-key">"answers"</span>: [
        { <span class="json-key">"questionId"</span>: <span class="json-string">"64f2ad3569fb2001bb97dd01"</span>, <span class="json-key">"selectedOption"</span>: <span class="json-string">"B"</span>, <span class="json-key">"timeSpent"</span>: <span class="json-num">45</span> },
        { <span class="json-key">"questionId"</span>: <span class="json-string">"64f2ad3569fb2001bb97dd02"</span>, <span class="json-key">"selectedOption"</span>: <span class="json-string">"A"</span>, <span class="json-key">"timeSpent"</span>: <span class="json-num">62</span> }
    ]
}</pre>
                    </div>
                </div>

                <!-- Dashboard -->
                <div class="api-card get">
                    <div class="api-meta">
                        <span class="method-badge">GET</span>
                        <span class="api-route">/api/dashboard/student/:studentId</span>
                        <span class="auth-needed">🔒 Token Cookie Required</span>
                    </div>
                    <div class="api-summary">Retrieve student metrics</div>
                    <p class="api-description">Compiles overall statistics: exams completed, average accuracy, subject weaknesses, and performance curves.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Response Template (200 OK)</div>
                        <pre><span class="json-key">"success"</span>: <span class="json-bool">true</span>,
<span class="json-key">"metrics"</span>: {
    <span class="json-key">"totalExamsTaken"</span>: <span class="json-num">12</span>,
    <span class="json-key">"averageAccuracy"</span>: <span class="json-num">78.5</span>,
    <span class="json-key">"totalAnomaliesTriggered"</span>: <span class="json-num">0</span>,
    <span class="json-key">"weakSubjects"</span>: [<span class="json-string">"Chemistry"</span>],
    <span class="json-key">"strongSubjects"</span>: [<span class="json-string">"Physics"</span>, <span class="json-string">"Mathematics"</span>]
}</pre>
                    </div>
                </div>
            </section>

            <!-- 5. Syllabus Section -->
            <section id="sect-syllabus" class="section-container">
                <div class="section-header-info">
                    <h2>Syllabus Scanning & Distributed Question Generator</h2>
                    <p>Trigger AI tasks to scan curriculum DOCX or PDF files, execute async FastAPI chapter extraction, and create balanced custom test papers.</p>
                </div>

                <!-- Upload Syllabus -->
                <div class="api-card post">
                    <div class="api-meta">
                        <span class="method-badge">POST</span>
                        <span class="api-route">/api/syllabus/upload</span>
                        <span class="auth-needed">🔒 Multipart File Upload</span>
                    </div>
                    <div class="api-summary">Upload curriculum document</div>
                    <p class="api-description">Receives a PDF/DOCX or image, extracts the text content, parses structured syllabus parameters, and stores details in local caches.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Form Data Content</div>
                        <table class="params-table">
                            <thead>
                                <tr><th>Field</th><th>Type</th><th>Constraint</th><th>Description</th></tr>
                            </thead>
                            <tbody>
                                <tr><td class="param-name">syllabusFile</td><td class="param-type">File binary</td><td><span class="param-req">required</span></td><td>PDF, DOCX, or JPG/PNG image up to 10MB.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Generate Paper -->
                <div class="api-card post">
                    <div class="api-meta">
                        <span class="method-badge">POST</span>
                        <span class="api-route">/api/syllabus/:id</span>
                        <span class="auth-needed">🔒 Token Cookie Required</span>
                    </div>
                    <div class="api-summary">Generate AI exam paper from syllabus</div>
                    <p class="api-description">Proxies curriculum contents to the Python FastAPI microservice to dynamically generate distributed, balanced test questions interleaving chapters.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Request Body Parameters</div>
                        <table class="params-table">
                            <thead>
                                <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
                            </thead>
                            <tbody>
                                <tr><td class="param-name">examName</td><td class="param-type">String</td><td><span class="param-req">required</span></td><td>Custom title for the generated paper.</td></tr>
                                <tr><td class="param-name">qCount</td><td class="param-type">Number</td><td><span class="param-opt">optional</span></td><td>Defaults to 15 questions.</td></tr>
                                <tr><td class="param-name">difficulty</td><td class="param-type">String</td><td><span class="param-opt">optional</span></td><td>Choice of: <code>Mixed</code>, <code>Easy</code>, <code>Medium</code>, <code>Hard</code>.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- 6. Proctoring Section -->
            <section id="sect-proctoring" class="section-container">
                <div class="section-header-info">
                    <h2>Live Proctoring & Real-time Sockets</h2>
                    <p>Initialize secure exam virtual rooms, sync live anomalies (blur, focus, fullscreen exits), and stream realtime student state to monitoring feeds.</p>
                </div>

                <!-- Create Room -->
                <div class="api-card post">
                    <div class="api-meta">
                        <span class="method-badge">POST</span>
                        <span class="api-route">/api/exam-room/create</span>
                        <span class="auth-needed">🔒 Teacher or Admin Required</span>
                    </div>
                    <div class="api-summary">Create live proctored exam room</div>
                    <p class="api-description">Creates a locked online exam room and returns a secure 6-character access code (e.g., <code>CHEM9X</code>).</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Request Body Parameters</div>
                        <pre>{
    <span class="json-key">"paperId"</span>: <span class="json-string">"64f2ad3569fb2001bb97ee12"</span>,
    <span class="json-key">"duration"</span>: <span class="json-num">60</span>,
    <span class="json-key">"allowedViolations"</span>: <span class="json-num">3</span>
}</pre>
                        <div class="detail-block-title">Example Response (201 Created)</div>
                        <pre><span class="json-key">"success"</span>: <span class="json-bool">true</span>,
<span class="json-key">"room"</span>: {
    <span class="json-key">"code"</span>: <span class="json-string">"CHEM9X"</span>,
    <span class="json-key">"paperId"</span>: <span class="json-string">"64f2ad3569fb2001bb97ee12"</span>,
    <span class="json-key">"duration"</span>: <span class="json-num">60</span>,
    <span class="json-key">"allowedViolations"</span>: <span class="json-num">3</span>,
    <span class="json-key">"isActive"</span>: <span class="json-bool">true</span>
}</pre>
                    </div>
                </div>

                <!-- Join Info -->
                <div class="api-card get">
                    <div class="api-meta">
                        <span class="method-badge">GET</span>
                        <span class="api-route">/api/exam-room/:code</span>
                        <span class="no-auth">Public Endpoint</span>
                    </div>
                    <div class="api-summary">Retrieve active room credentials</div>
                    <p class="api-description">Validates a 6-digit access code and returns room schedules, metadata, and validation parameters prior to entry.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Response Template (200 OK)</div>
                        <pre><span class="json-key">"success"</span>: <span class="json-bool">true</span>,
<span class="json-key">"room"</span>: {
    <span class="json-key">"code"</span>: <span class="json-string">"CHEM9X"</span>,
    <span class="json-key">"duration"</span>: <span class="json-num">60</span>,
    <span class="json-key">"allowedViolations"</span>: <span class="json-num">3</span>
}</pre>
                    </div>
                </div>

                <!-- Socket events -->
                <div class="api-card patch" style="background: rgba(99, 102, 241, 0.05);">
                    <div class="api-meta">
                        <span class="method-badge" style="background-color: rgba(99, 102, 241, 0.2); border-color: #6366f1; color: #818cf8;">SOCKET.IO</span>
                        <span class="api-route">Real-time Proctoring Events</span>
                    </div>
                    <div class="api-summary">WebSocket synchronized events mapping</div>
                    <p class="api-description">WebSocket events sent and received over Socket.io channel on the root server path.</p>
                    <button class="details-trigger" onclick="toggleDetails(this)">View Specifications ▾</button>
                    <div class="details-body">
                        <div class="detail-block-title">Available Senders & Listeners</div>
                        <table class="params-table">
                            <thead>
                                <tr><th>Event Name</th><th>Sender</th><th>Payload</th><th>Description</th></tr>
                            </thead>
                            <tbody>
                                <tr><td class="param-name">student_join</td><td class="param-type">Student</td><td><code>{ roomCode, studentId, studentName }</code></td><td>Connects student to exam sync room.</td></tr>
                                <tr><td class="param-name">teacher_join</td><td class="param-type">Teacher</td><td><code>{ roomCode }</code></td><td>Connects monitor dashboard to exam sync room.</td></tr>
                                <tr><td class="param-name">anomaly</td><td class="param-type">Student</td><td><code>{ anomalyType, count, timestamp }</code></td><td>Emitted when blur or fullscreen exit is caught.</td></tr>
                                <tr><td class="param-name">student_progress</td><td class="param-type">Student</td><td><code>{ questionNo, status }</code></td><td>Emits current question progress (answered, marked, review).</td></tr>
                                <tr><td class="param-name">alert_triggered</td><td class="param-type">Server</td><td><code>{ studentId, anomalyType, totalCount }</code></td><td>Relayed to teacher dashboard when anomaly occurs.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <footer>
        <p>&copy; 2026 Qnario AI-Powered live exam platform. All rights reserved.</p>
    </footer>

    <script>
        // Sidebar Category Navigation
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.section-container');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active classes
                navItems.forEach(i => i.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                // Add active class to clicked item
                item.classList.add('active');
                
                const targetSect = item.getAttribute('data-section');
                document.getElementById('sect-' + targetSect).classList.add('active');
            });
        });

        // Toggle Details collapsible panels
        function toggleDetails(btn) {
            const body = btn.nextElementSibling;
            if (body.classList.contains('open')) {
                body.classList.remove('open');
                btn.innerHTML = 'View Specifications ▾';
            } else {
                body.classList.add('open');
                btn.innerHTML = 'Hide Specifications ▴';
            }
        }

        // Copy code helper
        function copyCode(btn) {
            const pre = btn.parentElement;
            // Get content, remove copy button text
            const clone = pre.cloneNode(true);
            const copyBtn = clone.querySelector('.copy-btn');
            if (copyBtn) copyBtn.remove();
            
            const textToCopy = clone.innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = 'Copied!';
                btn.style.color = '#34d399';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.color = '';
                }, 2000);
            });
        }
    </script>
</body>
</html>
`;

module.exports = { getDocsHTML };
