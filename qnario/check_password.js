// check_password.js
// Usage: node check_password.js user@example.com plaintextPassword

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const [,, email, plain] = process.argv;
if (!email || !plain) {
  console.error('Usage: node check_password.js user@example.com plaintextPassword');
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

bcrypt.compare(plain, user.password).then(match => {
  if (match) {
    console.log('Password MATCHES for', email);
  } else {
    console.log('Password does NOT match for', email);
  }
}).catch(err => {
  console.error('bcrypt error:', err);
  process.exit(1);
});
