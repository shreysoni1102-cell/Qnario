// State management
let allUsers = [];
let currentFilter = 'users';
let deleteUserId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUsers();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!token || !adminUser) {
        window.location.href = 'admin-login.html';
        return;
    }

    const user = JSON.parse(adminUser);
    document.getElementById('adminName').textContent = `Welcome, ${user.name}`;
}

// Load all users from API
async function loadUsers() {
    const token = localStorage.getItem('adminToken');
    const usersContent = document.getElementById('usersContent');

    try {
        const response = await fetch('/api/auth/admin/all-users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                window.location.href = 'admin-login.html';
                return;
            }
            throw new Error('Failed to load users');
        }

        const data = await response.json();
        allUsers = data.users || [];
        updateStats();
        displayUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        usersContent.innerHTML = `<div class="error-msg">Failed to load users. Please try again.</div>`;
    }
}

// Update statistics
function updateStats() {
    const total = allUsers.length;
    const teachers = allUsers.filter(u => u.role === 'teacher').length;
    const students = allUsers.filter(u => u.role === 'student').length;

    document.getElementById('totalUsers').textContent = total;
    document.getElementById('totalTeachers').textContent = teachers;
    document.getElementById('totalStudents').textContent = students;
}

// Display users table
function displayUsers(users) {
    const usersContent = document.getElementById('usersContent');

    if (!users || users.length === 0) {
        usersContent.innerHTML = '<div class="error-msg">No users found.</div>';
        return;
    }

    let html = `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    users.forEach(user => {
        const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const roleBadgeClass = `role-${user.role}`;

        html += `
            <tr>
                <td>${escapeHtml(user.name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="role-badge ${roleBadgeClass}">${user.role}</span></td>
                <td>${joinDate}</td>
                <td>
                    <button class="action-btn btn-delete" onclick="openDeleteModal('${user._id}', '${escapeHtml(user.name)}')">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    usersContent.innerHTML = html;
}

// Switch between tabs
function switchTab(tab) {
    currentFilter = tab;
    
    // Update active menu item
    document.querySelectorAll('.sidebar-menu a').forEach(a => {
        a.classList.remove('active');
    });
    event.target.closest('a').classList.add('active');

    let filteredUsers = allUsers;
    let sectionTitle = 'All Users';

    if (tab === 'teachers') {
        filteredUsers = allUsers.filter(u => u.role === 'teacher');
        sectionTitle = 'Teachers';
    } else if (tab === 'students') {
        filteredUsers = allUsers.filter(u => u.role === 'student');
        sectionTitle = 'Students';
    }

    document.getElementById('sectionTitle').textContent = sectionTitle;
    displayUsers(filteredUsers);
}

// Open delete confirmation modal
function openDeleteModal(userId, userName) {
    deleteUserId = userId;
    document.getElementById('deleteUserName').textContent = userName;
    document.getElementById('deleteModal').classList.add('show');
}

// Close delete modal
function closeDeleteModal() {
    deleteUserId = null;
    document.getElementById('deleteModal').classList.remove('show');
}

// Confirm and delete user
async function confirmDelete() {
    if (!deleteUserId) return;

    const token = localStorage.getItem('adminToken');
    const deleteBtn = event.target;
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';

    try {
        const response = await fetch(`/api/auth/admin/user/${deleteUserId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        const data = await response.json();

        // Close modal
        closeDeleteModal();

        // Show success message
        showSuccessMessage(`${data.user} has been deleted successfully.`);

        // Reload users
        setTimeout(() => {
            loadUsers();
        }, 1500);
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete';
    }
}

// Show success message
function showSuccessMessage(message) {
    const successMsg = document.getElementById('successMsg');
    successMsg.textContent = message;
    successMsg.style.display = 'block';
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'admin-login.html';
}

// Utility function to escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('deleteModal');
    if (e.target === modal) {
        closeDeleteModal();
    }
});
