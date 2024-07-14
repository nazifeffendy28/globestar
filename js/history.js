import { getCurrentUser, getTransactionHistory } from './balance-management.js';

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    updateUserInfo(currentUser);
    loadTransactionHistory();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('backButton').addEventListener('click', () => window.location.href = 'dashboard.html');
    
    // Update this part
    document.getElementById('transactionBody').addEventListener('click', handleReceiptClick);
    
    document.getElementById('closeReceipt').addEventListener('click', () => {
        document.getElementById('receiptPopup').classList.remove('active');
        window.location.href = 'dashboard.html';
    });
}


function updateUserInfo(user) {
  document.getElementById('username').textContent = user.username;
  document.getElementById('wallet').textContent = `${user.wallet_address.substr(0, 6)}...${user.wallet_address.substr(-4)}`;
  updateTime();
}

function updateTime() {
  const timeElement = document.getElementById('time');
  const now = new Date();
  const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' };
  timeElement.textContent = now.toLocaleTimeString('en-US', options) + ' (UTC+7) ' + now.toLocaleDateString('en-US');
}

function loadTransactionHistory() {
    const currentUser = getCurrentUser();
    const transactions = getTransactionHistory(currentUser.id);
    const tableBody = document.getElementById('transactionBody');
    tableBody.innerHTML = '';
    
    transactions.forEach(transaction => {
      const row = tableBody.insertRow();
      row.innerHTML = `
        <td>${new Date(transaction.timestamp).toLocaleString()}</td>
        <td>${transaction.type}</td>
        <td>${transaction.coin}</td>
        <td>${transaction.amount}</td>
        <td>${transaction.address}</td>
        <td>${transaction.transactionId}</td>
        <td>${transaction.status}</td>
        <td><button class="receipt-button" data-id="${transaction.transactionId}">Receipt</button></td>
      `;
    });
}

function handleReceiptClick(event) {
    console.log('Click event triggered');
    if (event.target.classList.contains('receipt-button')) {
        console.log('Receipt button clicked');
        const transactionId = event.target.dataset.id;
        console.log('Transaction ID:', transactionId);
        const currentUser = getCurrentUser();
        const transactions = getTransactionHistory(currentUser.id);
        console.log('All transactions:', transactions);
        const transaction = transactions.find(t => t.transactionId === transactionId);
        if (transaction) {
            console.log('Transaction found:', transaction);
            showReceipt(transaction);
        } else {
            console.log('Transaction not found');
        }
    }
}

function showReceipt(transaction) {
    console.log('Showing receipt for transaction:', transaction);
    const receiptPopup = document.getElementById('receiptPopup');
    const receiptTitle = document.getElementById('receiptTitle');
    const receiptDetails = document.getElementById('receiptDetails');
    
    if (!receiptPopup || !receiptTitle || !receiptDetails) {
        console.error('Receipt popup elements not found');
        return;
    }
    
    receiptTitle.textContent = `${transaction.type} ${transaction.status}`;
  
  let receiptContent = `
    <p>To Address <span>${transaction.address}</span></p>
    <p>Amount GSX <span>${transaction.amount}</span></p>
    <p>Amount USDT <span>${(transaction.amount * 120.9).toFixed(4)}</span></p>
    <p>Transaction ID <span>${transaction.transactionId}</span></p>
  `;

  if (transaction.type === 'Send') {
    receiptContent = `
      <p>From Address <span>${transaction.fromAddress}</span></p>
      ${receiptContent}
      <p>Network Fee <span>${transaction.networkFee || 'N/A'} GSX</span></p>
      <p><span>≈ ${(transaction.networkFee * 120.9).toFixed(4) || 'N/A'} USDT</span></p>
      <p>Total Amount Send <span>${transaction.totalAmount || transaction.amount} GSX</span></p>
      <p><span>≈ ${((transaction.totalAmount || transaction.amount) * 120.9).toFixed(4)} USDT</span></p>
    `;
  } else if (transaction.type === 'Deposit') {
    receiptContent += `
      <p>Deposit Method <span>${transaction.depositMethod || 'N/A'}</span></p>
      <p>Admin Fee <span>${transaction.adminFee || 'N/A'} ${transaction.coin}</span></p>
      <p><span>≈ ${(transaction.adminFee * 120.9).toFixed(4) || 'N/A'} USDT</span></p>
      <p>Total Amount <span>${transaction.totalAmount || transaction.amount} ${transaction.coin}</span></p>
      <p><span>≈ ${((transaction.totalAmount || transaction.amount) * 120.9).toFixed(4)} USDT</span></p>
    `;
  }

    receiptDetails.innerHTML = receiptContent;
  
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date(transaction.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }) + ' (UTC+7)';
  
    const copyright = document.createElement('div');
    copyright.className = 'copyright';
    copyright.textContent = '© Globestar 2021';
  
    receiptDetails.appendChild(timestamp);
    receiptDetails.appendChild(copyright);
  
    receiptPopup.style.display = 'flex';  // Add this line
    receiptPopup.classList.add('active');
    console.log('Receipt popup activated');
    console.log('Popup display style:', receiptPopup.style.display);
    console.log('Popup classList:', receiptPopup.classList);
}