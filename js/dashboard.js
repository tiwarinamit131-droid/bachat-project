// js/dashboard.js
// Handles dashboard and reminders logic

document.addEventListener('DOMContentLoaded', function () {
  // DASHBOARD PAGE
  const totalExpensesDiv = document.getElementById('total-expenses');
  const balanceSummaryDiv = document.getElementById('balance-summary');
  const expenseHistoryDiv = document.getElementById('expense-history');

  // REMINDERS PAGE
  const remindersListDiv = document.getElementById('reminders-list');
  const remindersNoteDiv = document.getElementById('reminders-note');

  // Get data
  const groups = getLocalData('groups', []);
  const expenses = getLocalData('expenses', []);

  // Calculate balances for a group
  function calculateBalances(members, groupExpenses) {
    const balances = {};
    members.forEach(m => {
      balances[m] = { paid: 0, owed: 0, net: 0 };
    });
    groupExpenses.forEach(exp => {
      exp.involved.forEach(mem => {
        if (balances[mem]) balances[mem].owed += exp.splitAmount;
      });
      if (balances[exp.paidBy]) balances[exp.paidBy].paid += exp.amount;
    });
    members.forEach(m => {
      balances[m].net = +(balances[m].paid - balances[m].owed).toFixed(2);
    });
    return balances;
  }

  // Render dashboard summary
  if (totalExpensesDiv && balanceSummaryDiv) {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    totalExpensesDiv.innerHTML = `<h2>Total Group Expenses</h2><p style="font-size:1.5rem;font-weight:bold;">₹${total.toFixed(2)}</p>`;
    const balances = calculateBalances();
    let html = '<h2>Balance Summary</h2>';
    html += '<table style="width:100%;margin-top:1rem;text-align:left;">';
    html += '<tr><th>Member</th><th>Total Paid</th><th>Total Owed</th><th>Net Balance</th></tr>';
    members.forEach(m => {
      html += `<tr><td>${m}</td><td>₹${balances[m].paid.toFixed(2)}</td><td>₹${balances[m].owed.toFixed(2)}</td><td>${balances[m].net >= 0 ? '<span style="color:green;">' : '<span style="color:#e74c3c;">'}₹${balances[m].net.toFixed(2)}</span></td></tr>`;
    });
    html += '</table>';
    // Who pays whom
    const payers = members.filter(m => balances[m].net < 0);
    const receivers = members.filter(m => balances[m].net > 0);
    if (payers.length && receivers.length) {
      html += '<div style="margin-top:1.2rem;">';
      payers.forEach(p => {
        receivers.forEach(r => {
          if (balances[p].net < 0 && balances[r].net > 0) {
            const amt = Math.min(-balances[p].net, balances[r].net);
            if (amt > 0) {
              html += `<div>${p} should pay <strong>₹${amt.toFixed(2)}</strong> to ${r}</div>`;
              balances[p].net += amt;
              balances[r].net -= amt;
            }
          }
        });
      });
      html += '</div>';
    }
    balanceSummaryDiv.innerHTML = html;
  }

  // Render expense history
  if (expenseHistoryDiv) {
    if (expenses.length === 0) {
      expenseHistoryDiv.innerHTML = '<p>No expenses added yet.</p>';
    } else {
      expenseHistoryDiv.innerHTML = '';
      expenses.slice().reverse().forEach(exp => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<strong>${exp.title}</strong> <span style="float:right;">₹${exp.amount.toFixed(2)}</span><br>
          <small>${new Date(exp.date).toLocaleString()}</small><br>
          <span>Category: ${exp.category}</span><br>
          <span>Paid by: ${exp.paidBy}</span><br>
          <span>Split among: ${exp.involved.join(', ')}</span>`;
        expenseHistoryDiv.appendChild(div);
      });
    }
  }

  // Render reminders for all groups the user is a member of
  if (remindersListDiv) {
    const user = getLocalData('user', { name: '' });
    remindersListDiv.innerHTML = '';
    let hasReminders = false;
    if (!user.name) {
      remindersListDiv.innerHTML = '<p>Please set your name on the Home page to see your reminders.</p>';
    } else {
      // For each group the user is a member of
      groups.forEach(group => {
        if (group.members.includes(user.name)) {
          // Get expenses for this group
          const groupExpenses = expenses.filter(e => (e.group || '').trim().toLowerCase() === (group.name || '').trim().toLowerCase());
          const balances = calculateBalances(group.members, groupExpenses);
          // What you owe in this group
          if (balances[user.name].net < 0) {
            hasReminders = true;
            const div = document.createElement('div');
            div.className = 'reminder-card';
            div.innerHTML = `You owe <span style="color:#e74c3c;font-weight:bold;">₹${(-balances[user.name].net).toFixed(2)}</span> in <strong>${group.name}</strong>`;
            remindersListDiv.appendChild(div);
          }
          // What others owe you in this group
          group.members.forEach(m => {
            if (m !== user.name && balances[m].net < 0 && balances[user.name].net > 0) {
              const amt = Math.min(-balances[m].net, balances[user.name].net);
              if (amt > 0) {
                hasReminders = true;
                const div = document.createElement('div');
                div.className = 'reminder-card';
                div.innerHTML = `<span style="color:#e74c3c;font-weight:bold;">${m} owes you ₹${amt.toFixed(2)}</span> in <strong>${group.name}</strong>`;
                remindersListDiv.appendChild(div);
              }
            }
          });
        }
      });
      // If user is not a member of any group
      const userGroups = groups.filter(group => group.members.includes(user.name));
      if (!hasReminders && userGroups.length > 0) {
        remindersListDiv.innerHTML = '<p>No pending settlements for you in any group! 🎉</p>';
      }
      if (userGroups.length === 0) {
        remindersListDiv.innerHTML = '<p>You are not a member of any group.</p>';
      }
    }
    if (remindersNoteDiv) remindersNoteDiv.textContent = 'Reminders are personalized for you.';
  }
});
