// reset_password.js
// Usage: node reset_password.js user@example.com newPlaintextPassword

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const [,, email, newPassword] = process.argv;
if (!email || !newPassword) {
  console.error('Usage: node reset_password.js user@example.com newPlaintextPassword');
  process.exit(2);
}

const file = path.join(__dirname, 'users.json');
if (!fs.existsSync(file)) {
  console.error('users.json not found in', __dirname);
  process.exit(1);
}

let users;
try {
  users = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error('Failed to read users.json:', e.message || e);
  process.exit(1);
}

const user = users.find(u => u.email === email);
if (!user) {
  console.error('User not found:', email);
  process.exit(1);
}

bcrypt.hash(newPassword, 10).then(hash => {
  user.password = hash;
  fs.writeFileSync(file, JSON.stringify(users, null, 2), 'utf8');
  console.log('Password reset for', email);
}).catch(err => {
  console.error('bcrypt/hash error:', err);
  process.exit(1);
});
