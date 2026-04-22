// Currency converter logic moved to expenses.js
// js/analytics.js
// Handles analytics and Bachat Score logic

document.addEventListener('DOMContentLoaded', function () {
    // --- LIMITS LOGIC ---
    const limitsForm = document.getElementById('limits-form');
    const limitDaily = document.getElementById('limit-daily');
    const limitWeekly = document.getElementById('limit-weekly');
    const limitMonthly = document.getElementById('limit-monthly');
    const limitsMsg = document.getElementById('limits-msg');

    // Load limits from localStorage
    function loadLimits() {
      const limits = getLocalData('limits', { daily: '', weekly: '', monthly: '' });
      if (limitDaily) limitDaily.value = limits.daily;
      if (limitWeekly) limitWeekly.value = limits.weekly;
      if (limitMonthly) limitMonthly.value = limits.monthly;
    }
    loadLimits();

    if (limitsForm) {
      limitsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const limits = {
          daily: limitDaily.value,
          weekly: limitWeekly.value,
          monthly: limitMonthly.value
        };
        setLocalData('limits', limits);
        limitsMsg.textContent = 'Limits saved!';
        setTimeout(() => limitsMsg.textContent = '', 2000);
      });
    }
  const analyticsCardsDiv = document.getElementById('analytics-cards');
  const bachatScoreDiv = document.getElementById('bachat-score');

  const expenses = getLocalData('expenses', []);
  const groups = getLocalData('groups', []);
  const members = groups.length > 0 ? groups[0].members : [];

  // Calculate category totals
  const categories = ['Food', 'Travel', 'Shopping', 'Miscellaneous'];
  const catTotals = {};
  categories.forEach(cat => catTotals[cat] = 0);
  expenses.forEach(exp => {
    if (catTotals.hasOwnProperty(exp.category)) {
      catTotals[exp.category] += exp.amount;
    }
  });

  // Render analytics cards with distinct colors
  if (analyticsCardsDiv) {
    analyticsCardsDiv.innerHTML = '';
    const catClass = {
      Food: 'analytics-card-food',
      Travel: 'analytics-card-travel',
      Shopping: 'analytics-card-shopping',
      Miscellaneous: 'analytics-card-misc'
    };
    categories.forEach(cat => {
      const div = document.createElement('div');
      div.className = `card ${catClass[cat] || ''}`;
      div.innerHTML = `<strong>${cat}</strong><br><span style="font-size:1.3rem;">₹${catTotals[cat].toFixed(2)}</span>`;
      analyticsCardsDiv.appendChild(div);
    });
  }

  // Render pie chart for categories (modern look, distinct colors)
  const pieCanvas = document.getElementById('category-pie');
  if (pieCanvas) {
    const data = {
      labels: categories,
      datasets: [{
        data: categories.map(cat => catTotals[cat]),
        backgroundColor: [
          '#ffb347', // Food
          '#42a5f5', // Travel
          '#e040fb', // Shopping
          '#b2dfdb'  // Miscellaneous
        ],
        borderColor: [
          '#fff', '#fff', '#fff', '#fff'
        ],
        borderWidth: 3,
        hoverOffset: 16,
      }]
    };
    new Chart(pieCanvas, {
      type: 'pie',
      data: data,
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 15, weight: 'bold' },
              color: '#168f3e',
              padding: 18
            }
          },
          title: {
            display: true,
            text: 'Expense Distribution by Category',
            font: { size: 20, weight: 'bold' },
            color: '#168f3e',
            padding: { top: 10, bottom: 20 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ₹${value.toFixed(2)}`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true
        },
        cutout: '0%',
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }
  // --- Currency Converter (static, always works) ---
  const currencyForm = document.getElementById('currency-form');
  const currencyAmount = document.getElementById('currency-amount');
  const currencyFrom = document.getElementById('currency-from');
  const currencyTo = document.getElementById('currency-to');
  const currencyResult = document.getElementById('currency-result');
  const currencySwitch = document.getElementById('currency-switch');

  
  const currencyList = [
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
     
  ];

  function populateCurrencySelects() {
    if (!currencyFrom || !currencyTo) return;
    currencyFrom.innerHTML = '';
    currencyTo.innerHTML = '';
    currencyList.forEach(cur => {
      const opt1 = document.createElement('option');
      opt1.value = cur.code;
      opt1.textContent = `${cur.code} - ${cur.name}`;
      currencyFrom.appendChild(opt1);
      const opt2 = document.createElement('option');
      opt2.value = cur.code;
      opt2.textContent = `${cur.code} - ${cur.name}`;
      currencyTo.appendChild(opt2);
    });
    currencyFrom.value = 'INR';
    currencyTo.value = 'USD';
  }
  populateCurrencySelects();

  // Static exchange rates (relative to 1 INR)
  const staticRates = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    
    
  };

  function fetchRate(from, to) {
    if (from === to) return 1;
    // Convert from -> INR, then INR -> to
    const inrValue = 1 / (staticRates[from] || 1);
    const rate = inrValue * (staticRates[to] || 1);
    return rate;
  }

  if (currencyForm) {
    currencyForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const amt = parseFloat(currencyAmount.value);
      const from = currencyFrom.value;
      const to = currencyTo.value;
      if (!amt || amt < 0) {
        currencyResult.style.color = '#e74c3c';
        currencyResult.textContent = 'Enter a valid amount.';
        return;
      }
      currencyResult.style.color = '#1db954';
      currencyResult.textContent = 'Converting...';
      const rate = fetchRate(from, to);
      const converted = amt * rate;
      currencyResult.style.color = '#e74c3c';
      currencyResult.textContent = `${amt} ${from} = ${converted.toFixed(2)} ${to}`;
    });
  }
  if (currencySwitch) {
    currencySwitch.addEventListener('click', function() {
      const from = currencyFrom.value;
      const to = currencyTo.value;
      currencyFrom.value = to;
      currencyTo.value = from;
    });
  }

  // Calculate Bachat Score (0-10, never 10, penalize overspending)
  function calcBachatScore10() {
    let score = 5;
    // +2 for >5 expenses
    if (expenses.length > 5) score += 2;
    // +1 for <20% pending balances
    const balances = {};
    members.forEach(m => balances[m] = 0);
    expenses.forEach(exp => {
      exp.involved.forEach(mem => balances[mem] -= exp.splitAmount);
      balances[exp.paidBy] += exp.amount;
    });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    let pending = 0;
    members.forEach(m => { if (balances[m] < 0) pending += -balances[m]; });
    if (total > 0 && pending / total < 0.2) score += 1;
    // +1 for activity in last 7 days
    const now = Date.now();
    if (expenses.some(e => now - new Date(e.date).getTime() < 7 * 24 * 60 * 60 * 1000)) score += 1;

    // --- Overspending penalty ---
    const limits = getLocalData('limits', { daily: '', weekly: '', monthly: '' });
    // Calculate spent in last 1, 7, 30 days
    let spentDaily = 0, spentWeekly = 0, spentMonthly = 0;
    expenses.forEach(e => {
      const daysAgo = (now - new Date(e.date).getTime()) / (1000*60*60*24);
      if (daysAgo < 1) spentDaily += e.amount;
      if (daysAgo < 7) spentWeekly += e.amount;
      if (daysAgo < 30) spentMonthly += e.amount;
    });
    let overspent = false;
    if (limits.daily && spentDaily > Number(limits.daily)) overspent = true;
    if (limits.weekly && spentWeekly > Number(limits.weekly)) overspent = true;
    if (limits.monthly && spentMonthly > Number(limits.monthly)) overspent = true;
    if (overspent) score -= 2;

    // Never allow 10
    if (score >= 10) score = 9.9;
    return Math.max(0, Math.round(score * 10) / 10);
  }

  if (bachatScoreDiv) {
    bachatScoreDiv.textContent = calcBachatScore10();
  }

  // --- Personalized Bachat Tip (distinct for each score) ---
  const personalTipDiv = document.getElementById('personal-bachat-tip');
  if (personalTipDiv) {
    const score = calcBachatScore10();
    let tip = '', tipClass = 'neutral';
    if (score >= 9) {
      tip = "🌟 <b>Outstanding!</b> You are a true Bachat master! Keep tracking and saving, and maybe teach your friends your secrets.";
      tipClass = 'positive';
    } else if (score >= 8) {
      tip = "💪 <b>Impressive!</b> Your expense management is top-notch. Try setting a new savings goal this month.";
      tipClass = 'positive';
    } else if (score >= 7) {
      tip = "👏 <b>Great job!</b> You’re managing your expenses well. Review your limits and try to save a little more each week.";
      tipClass = 'positive';
    } else if (score >= 6) {
      tip = "🧐 <b>Almost there!</b> You’re doing well, but check if you can cut down on one category this week.";
      tipClass = 'neutral';
    } else if (score >= 5) {
      tip = "👍 <b>Good effort!</b> There’s room for improvement. Set clear limits and track your spending daily to boost your score.";
      tipClass = 'neutral';
    } else if (score >= 4) {
      tip = "⚠️ <b>Heads up!</b> Try to avoid overspending in any one category. Set realistic limits and stick to them for better financial health.";
      tipClass = 'negative';
    } else if (score >= 3) {
      tip = "🔍 <b>Review needed!</b> Check your biggest expenses and see where you can cut back. Small changes add up!";
      tipClass = 'negative';
    } else if (score >= 2) {
      tip = "🚨 <b>Take action!</b> Your Bachat Score is low. Start by setting daily, weekly, and monthly limits, and review your expenses regularly.";
      tipClass = 'negative';
    } else {
      tip = "❗ <b>Urgent!</b> You need to take control of your spending. Log every expense, set strict limits, and ask a friend for accountability.";
      tipClass = 'negative';
    }
    personalTipDiv.innerHTML = tip;
    personalTipDiv.className = 'tip-card ' + tipClass;
  }
});
