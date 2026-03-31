// js/app.js
// Shared logic for navbar, Bachat Tip, and utility functions

document.addEventListener('DOMContentLoaded', function () {
    // User name logic
    const userForm = document.getElementById('user-form');
    const userNameInput = document.getElementById('user-name');
    const userMsg = document.getElementById('user-msg');
    if (userForm && userNameInput) {
      // Load if already set
      const saved = getLocalData('user', { name: '' });
      if (saved.name) userNameInput.value = saved.name;
      userForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = userNameInput.value.trim();
        if (!name) {
          userMsg.textContent = 'Please enter your name.';
          return;
        }
        setLocalData('user', { name });
        userMsg.textContent = 'Name saved!';
        setTimeout(() => userMsg.textContent = '', 2000);
      });
    }
  // Highlight active nav link
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    if (window.location.pathname.endsWith(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });

  // Bachat Tip of the Day
  const tips = [
    "Track every expense, no matter how small!",
    "Settle balances regularly to avoid confusion.",
    "Review your spending categories every week.",
    "Save first, spend later!",
    "Discuss expenses openly with your group.",
    "Use BACHAT to avoid awkward money talks.",
    "Plan group budgets before trips.",
    "Keep receipts for big expenses.",
    "Analyze your spending patterns monthly.",
    "Aaj Bachat Kari? Start today!"
  ];
  const tipDiv = document.getElementById('tip-of-day');
  if (tipDiv) {
    const tipIndex = new Date().getDate() % tips.length;
    tipDiv.textContent = tips[tipIndex];
  }
});

// Utility: Get data from localStorage
function getLocalData(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

// Utility: Set data to localStorage
function setLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore write errors
  }
}
