import * as balanceManagement from './balance-management.js';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Main script loaded');

    async function initialize() {
        try {
            await balanceManagement.initializeUserData();
            if (checkLoginState()) {
                await refreshUserData();
                updateDashboard();
                setInterval(updateTime, 1000);
            } else {
                console.log('No current user');
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    function checkLoginState() {
        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
            const user = JSON.parse(userJson);
            balanceManagement.setCurrentUser(user);
            return true;
        }
        return false;
    }

    async function refreshUserData() {
        const currentUser = balanceManagement.getCurrentUser();
        if (currentUser) {
            try {
                const response = await fetch(`http://localhost:5000/api/user/${currentUser.wallet_address}`);
                const data = await response.json();
                if (data.status === 'success') {
                    balanceManagement.setCurrentUser(data.user);
                } else {
                    console.error('Failed to refresh user data:', data.message);
                }
            } catch (error) {
                console.error('Error refreshing user data:', error);
            }
        }
    }

    function updateDashboard() {
        console.log('Updating dashboard');
        const currentUser = balanceManagement.getCurrentUser();
        if (currentUser) {
            document.getElementById('username').textContent = currentUser.username;
            document.getElementById('wallet').textContent = `${currentUser.wallet_address.substr(0, 6)}...${currentUser.wallet_address.substr(-4)}`;
            updateBalanceDisplay(currentUser);
            updateTime();
        } else {
            console.log('No current user');
            window.location.href = 'index.html';
        }
    }

    function updateBalanceDisplay(user) {
        if (user) {
            const balanceAmount = document.getElementById('balanceAmount');
            const balanceUSD = document.getElementById('balanceUSD');
            const gsx = user.balance_gsx.toLocaleString();
            const usdt = (user.balance_gsx * 204.49).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            balanceAmount.textContent = gsx;
            balanceUSD.textContent = usdt;
        }
    }

    function updateTime() {
        const timeElement = document.getElementById('time');
        if (timeElement) {
            const now = new Date();
            const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' };
            timeElement.textContent = now.toLocaleTimeString('en-US', options) + ' (UTC+7) ' + now.toLocaleDateString('en-US');
        }
    }

    function logout() {
        console.log('Logout function called');
        localStorage.removeItem('currentUser');
        balanceManagement.logout();
        window.location.href = 'index.html';
    }

    function setupEventListeners() {
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }
    
        const depositButton = document.getElementById('depositButton');
        const sendButton = document.getElementById('sendButton');
        const receiveButton = document.getElementById('receiveButton');
        const historyButton = document.getElementById('historyButton');
    
        if (depositButton) {
            depositButton.addEventListener('click', () => {
                console.log('Deposit button clicked');
                window.location.href = 'deposit.html';
            });
        }
    
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                console.log('Send button clicked');
                window.location.href = 'send.html';
            });
        }
    
        if (receiveButton) {
            receiveButton.addEventListener('click', () => {
                console.log('Receive button clicked');
                window.location.href = 'receive.html';
            });
        }
    
        if (historyButton) {
            historyButton.addEventListener('click', () => {
                console.log('History button clicked');
                window.location.href = 'history.html';
            });
        }
    }

    // Check if we're on the dashboard page
    if (document.getElementById('dashboardPage')) {
        console.log('Dashboard page detected');
        initialize();
        setupEventListeners();
    } else {
        console.log('Not on dashboard page');
    }
});