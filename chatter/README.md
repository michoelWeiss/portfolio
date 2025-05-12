# 💬 Chatter – Authentication-First Chat App (Work in Progress)

**Chatter** is a secure and scalable Node.js-based chat application built using the **Express Generator** framework. This project emphasizes robust authentication features before introducing full messaging functionality. The backend is designed to handle user sign-ins, account recovery, and email verification — all implemented with security and user experience in mind.

---

## 🚀 Project Status

🟡 **In Development**  
The authentication system is nearly complete. Messaging functionality is planned next.

---

## 🔐 Authentication Features (Completed / In Progress)

- ✅ **User registration with email verification**  
  When a user signs up, their data is saved but marked as unverified. A verification email is sent with a secure link. Only after clicking the link is the user officially logged in.

- 🔐 **Multiple sign-in paths:**
  - Standard **username + password** login
  - **Forgot password** recovery
  - **Forgot username** support
  - Combined **forgot username/password** flow
  - **Security question fallback** for recovery
  - All passwords are **securely hashed** before storage

- ✉️ **Email integration** for verification and recovery processes

- 🛠️ **Session management** and login validation logic (in progress)

---

## 📦 Tech Stack

- **Node.js + Express** (generated via `express-generator`)
- **SQL** for persistent user storage
- **Nodemailer** for sending verification and recovery emails
- **bcrypt** for hashing passwords
- **Express Sessions** or JWT for managing user sessions (TBD)
- **EJS** or other templating (depending on your setup)

---

## 📋 Planned Features

Once authentication is complete, development will shift to real-time chat functionality, including:

- 💬 **User-to-user messaging**
- 🟢 **Presence and online status**
- 🧑‍🤝‍🧑 **Group chat support**
- 📱 **Responsive UI and chat UX**


---

## 📬 Contact

Have feedback, questions, or want to connect?

- **Email:** michoelweissmw@gmail.com  
- **Website:** [michoelweiss.com](https://michoelweiss.com)


