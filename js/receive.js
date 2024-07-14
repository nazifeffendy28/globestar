import { getCurrentUser, updateBalanceDisplay } from './balance-management.js';

document.addEventListener('DOMContentLoaded', function() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
  
  updateUserInfo(currentUser);
  setupNetworkSelect();
  setupBackButton();
  setInterval(updateTime, 1000);
});

function updateUserInfo(user) {
  document.getElementById('username').textContent = user.username;
  document.getElementById('wallet').textContent = `${user.wallet_address.substr(0, 6)}...${user.wallet_address.substr(-4)}`;
  document.getElementById('walletAddress').value = user.wallet_address;
  updateBalanceDisplay();
  updateTime();
}

function updateTime() {
  const timeElement = document.getElementById('time');
  const now = new Date();
  const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' };
  timeElement.textContent = now.toLocaleTimeString('en-US', options) + ' (UTC+7) ' + now.toLocaleDateString('en-US');
}

function setupNetworkSelect() {
  const networkSelect = document.getElementById('networkSelect');
  networkSelect.value = 'GSX';
  networkSelect.disabled = true;
}

function setupBackButton() {
  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }
}