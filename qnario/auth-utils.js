export function isValidEmail(email) {
    // Accept only these domains
    const allowedDomains = [
        '@gmail.com', '@hotmail.com', '.edu.in', '@yahoo.com', '@outlook.com'
    ];
    // Basic email format check
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;
    return emailPattern.test(email) && allowedDomains.some(domain => email.endsWith(domain));
}

export function isValidMobile(mobile) {
    return /^\d{10}$/.test(mobile);
}

// ⚠️  LEGACY FUNCTION — DO NOT USE for new registrations.
// This function stores passwords in plain text in localStorage.
// Real signup/login goes through the backend: POST /api/signup & /api/login
// This is kept only for backward-compatibility with old sessions.
export function signup(email, password, mobile, role) {
    if (!isValidEmail(email)) {
        alert('Email must be a valid domain (gmail, hotmail, edu.in, yahoo, outlook)');
        return false;
    }
    if (!isValidMobile(mobile)) {
        alert('Mobile number must be exactly 10 digits.');
        return false;
    }
    let users = JSON.parse(localStorage.getItem('qnario_users') || '[]');
    if (users.some(u => u.email === email)) {
        alert('Email already registered!');
        return false;
    }
    users.push({ email, password, mobile, role });
    localStorage.setItem('qnario_users', JSON.stringify(users));
    alert('Registration successful!');
    return true;
}

export function login(email, password) {
    let users = JSON.parse(localStorage.getItem('qnario_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        alert('Invalid email or password!');
        return false;
    }
    localStorage.setItem('qnario_current_user', JSON.stringify(user));
    alert('Login successful!');
    // Redirect based on role
    if (user.role === 'teacher') {
        window.location.href = 'teacher-dashboard.html';
    } else if (user.role === 'student') {
        window.location.href = 'student-dashboard.html';
    }
    return true;
}

export function logout() {
    localStorage.removeItem('qnario_current_user');
    window.location.href = 'index.html';
}