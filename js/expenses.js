// js/expenses.js
// Handles group creation, member management, and e

document.addEventListener('DOMContentLoaded', function () {
  // GROUPS PAGE LOGIC
  const groupForm = document.getElementById('group-form');
  const memberNameInput = document.getElementById('member-name');
  const addMemberBtn = document.getElementById('add-member-btn');
  const membersListDiv = document.getElementById('members-list');
  const groupsListDiv = document.getElementById('groups-list');
  const groupFormMsg = document.getElementById('group-form-msg');

  let members = [];
  // Always reset members array and UI on page load
  if (membersListDiv) membersListDiv.innerHTML = '';

  if (groupForm) {
    // Add member to list
    addMemberBtn.addEventListener('click', function () {
      const name = memberNameInput.value.trim();
      if (name && !members.includes(name)) {
        members.push(name);
        renderMembers();
        memberNameInput.value = '';
      }
    });

    // Render members
    function renderMembers() {
      membersListDiv.innerHTML = '';
      members.forEach(m => {
        const span = document.createElement('span');
        span.textContent = m;
        membersListDiv.appendChild(span);
      });
    }

    // Handle group creation
    groupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const groupName = document.getElementById('group-name').value.trim();
      if (!groupName) {
        groupFormMsg.textContent = 'Enter a group name.';
        return;
      }
      if (members.length < 2) {
        groupFormMsg.textContent = 'Add at least 2 members.';
        return;
      }
      // Save group
      const groups = getLocalData('groups', []);
      if (groups.some(g => g.name === groupName)) {
        groupFormMsg.textContent = 'Group name already exists.';
        return;
      }
      groups.push({ name: groupName, members });
      setLocalData('groups', groups);
      groupFormMsg.textContent = 'Group created!';
      members = [];
      renderMembers();
      groupForm.reset();
      renderGroups();
      setTimeout(() => groupFormMsg.textContent = '', 2000);
    });

    // Render groups (make clickable, with delete)
    function renderGroups() {
      const groups = getLocalData('groups', []);
      groupsListDiv.innerHTML = '';
      if (groups.length === 0) {
        groupsListDiv.innerHTML = '<p>No groups created yet.</p>';
        return;
      }
      groups.forEach(g => {
        const div = document.createElement('div');
        div.className = 'card group-card';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        // Group info clickable area
        const infoDiv = document.createElement('div');
        infoDiv.style.cursor = 'pointer';
        infoDiv.innerHTML = `<strong>${g.name}</strong><br>Members: ${g.members.join(', ')}`;
        infoDiv.addEventListener('click', function() {
          setLocalData('selectedGroup', g.name);
          setTimeout(() => { window.location.href = 'add-expense.html'; }, 100);
        });
        // Delete button
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'btn';
        delBtn.style.background = '#e74c3c';
        delBtn.style.color = '#fff';
        delBtn.style.marginLeft = '1rem';
        delBtn.onclick = function(e) {
          e.stopPropagation();
          // Check for unsettled balances before deletion
          const expenses = getLocalData('expenses', []);
          const groupExpenses = expenses.filter(ex => (ex.group || '').trim().toLowerCase() === (g.name || '').trim().toLowerCase());
          // Calculate balances for the group
          let balances = {};
          if (groupExpenses.length > 0) {
            g.members.forEach(m => { balances[m] = 0; });
            groupExpenses.forEach(ex => {
              // Paid by gets full amount
              balances[ex.paidBy] += ex.amount;
              // Each involved owes splitAmount
              ex.involved.forEach(inv => {
                balances[inv] -= ex.splitAmount;
              });
            });
          }
          // Check if all balances are settled (all close to zero)
          const unsettled = Object.values(balances).some(bal => Math.abs(bal) > 0.01);
          if (unsettled) {
            if (groupFormMsg) {
              groupFormMsg.textContent = 'Cannot delete: There is money that needs to be settled in this group!';
              groupFormMsg.style.color = '#e74c3c';
              setTimeout(() => { groupFormMsg.textContent = ''; groupFormMsg.style.color = ''; }, 3500);
            }
            return;
          }
          if (confirm('Are you sure you want to delete this group? All past expenses for this group will also be deleted.')) {
            // Remove group
            const groups = getLocalData('groups', []);
            const filtered = groups.filter(gr => (gr.name || '').trim().toLowerCase() !== (g.name || '').trim().toLowerCase());
            setLocalData('groups', filtered);
            // Remove all expenses for this group
            const newExpenses = expenses.filter(ex => (ex.group || '').trim().toLowerCase() !== (g.name || '').trim().toLowerCase());
            setLocalData('expenses', newExpenses);
            setTimeout(renderGroups, 0);
            if (groupFormMsg) {
              groupFormMsg.textContent = 'Group and all its expenses deleted!';
              groupFormMsg.style.color = '#1db954';
              setTimeout(() => { groupFormMsg.textContent = ''; groupFormMsg.style.color = ''; }, 2000);
            }
          }
        };
        div.appendChild(infoDiv);
        div.appendChild(delBtn);
        groupsListDiv.appendChild(div);
      });
    }
    renderGroups();
  }

  // ADD EXPENSE PAGE LOGIC
  const expenseForm = document.getElementById('expense-form');
  const paidBySelect = document.getElementById('paid-by');
  const membersCheckboxesDiv = document.getElementById('members-checkboxes');
  const expenseFormMsg = document.getElementById('expense-form-msg');

  if (expenseForm) {
    // Use selected group if set
    const selectedGroupName = getLocalData('selectedGroup', null);
    const groups = getLocalData('groups', []);
    let groupMembers = [];
    let group = null;
    if (selectedGroupName) {
      group = groups.find(g => g.name === selectedGroupName);
    }
    if (!group && groups.length > 0) {
      group = groups[0];
    }
    if (group) {
      groupMembers = group.members;
    }
    paidBySelect.innerHTML = '';
    groupMembers.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      paidBySelect.appendChild(opt);
    });
    // Members checkboxes
    membersCheckboxesDiv.innerHTML = '';
    groupMembers.forEach(m => {
      const label = document.createElement('label');
      label.style.marginRight = '1rem';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = m;
      cb.checked = true;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + m));
      membersCheckboxesDiv.appendChild(label);
    });

    // Handle expense form submit
    expenseForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const title = document.getElementById('expense-title').value.trim();
      const amountStr = document.getElementById('expense-amount').value.trim();
      const currency = document.getElementById('expense-currency') ? document.getElementById('expense-currency').value : 'INR';
      // Validation: not empty, not zero, not negative, not special chars/letters
      if (!/^(?!0+$)\d+(\.\d{1,2})?$/.test(amountStr) || parseFloat(amountStr) <= 0) {
        expenseFormMsg.textContent = 'Enter a valid positive amount (no letters or special symbols, not zero or negative).';
        return;
      }
      const amount = parseFloat(amountStr);
      const category = document.getElementById('expense-category').value;
      const paidBy = paidBySelect.value;
      const involved = Array.from(membersCheckboxesDiv.querySelectorAll('input:checked')).map(cb => cb.value);
      if (!title || !amount || !category || !paidBy || involved.length === 0) {
        expenseFormMsg.textContent = 'Fill all fields and select at least one member.';
        return;
      }
      // Equal split
      const splitAmount = +(amount / involved.length).toFixed(2);
      // Save expense
      const expenses = getLocalData('expenses', []);
      expenses.push({
        title, amount, currency, category, paidBy, involved, splitAmount, date: new Date().toISOString(), group: selectedGroupName || (groups[0] ? groups[0].name : null)
      });
      setLocalData('expenses', expenses);
      expenseFormMsg.textContent = 'Expense added!';
      expenseForm.reset();
      setTimeout(() => expenseFormMsg.textContent = '', 2000);
    });
    // Clear selected group after loading
    setLocalData('selectedGroup', null);
  }
  // --- Currency Converter for Add Expense page ---
  const currencyForm = document.getElementById('currency-form');
  const currencyAmount = document.getElementById('currency-amount');
  const currencyFrom = document.getElementById('currency-from');
  const currencyTo = document.getElementById('currency-to');
  const currencyResult = document.getElementById('currency-result');
  const currencySwitch = document.getElementById('currency-switch');

  // List of major currencies
  const currencyList = [
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'RUB', name: 'Russian Ruble' },
    { code: 'KRW', name: 'South Korean Won' },
    { code: 'MXN', name: 'Mexican Peso' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'SAR', name: 'Saudi Riyal' }
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
    GBP: 0.0097,
    JPY: 1.81,
    CNY: 0.087,
    CAD: 0.016,
    AUD: 0.018,
    SGD: 0.016,
    AED: 0.044,
    CHF: 0.011,
    ZAR: 0.22,
    BRL: 0.061,
    RUB: 1.09,
    KRW: 16.5,
    MXN: 0.20,
    THB: 0.44,
    SEK: 0.13,
    NZD: 0.019,
    SAR: 0.045
  };

  function fetchRate(from, to) {
    if (from === to) return 1;
    // Convert from -> INR, then INR -> to
    // All rates are relative to 1 INR
    // To convert X from 'from' to 'to':
    // 1. Convert X 'from' to INR: X / staticRates[from]
    // 2. Convert INR to 'to': (X / staticRates[from]) * staticRates[to]
    if (!staticRates[from] || !staticRates[to]) return null;
    return staticRates[to] / staticRates[from];
  }

  if (currencyForm) {
    currencyForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const amtStr = currencyAmount.value.trim();
      if (!/^(?!0+$)\d+(\.\d{1,2})?$/.test(amtStr) || parseFloat(amtStr) <= 0) {
        currencyResult.style.color = '#e74c3c';
        currencyResult.textContent = 'Enter a valid positive amount (no letters or special symbols, not zero or negative).';
        return;
      }
      const amt = parseFloat(amtStr);
      const from = currencyFrom.value;
      const to = currencyTo.value;
      const rate = fetchRate(from, to);
      if (!rate) {
        currencyResult.style.color = '#e74c3c';
        currencyResult.textContent = 'Invalid currency selection.';
        return;
      }
      const converted = amt * rate;
      currencyResult.style.color = '#1db954';
      currencyResult.textContent = `${amt} ${from} = ${converted.toFixed(2)} ${to}`;
    });
  }

  // Switch currencies
  if (currencySwitch) {
    currencySwitch.addEventListener('click', function() {
      const from = currencyFrom.value;
      const to = currencyTo.value;
      currencyFrom.value = to;
      currencyTo.value = from;
    });
  }

});
