document.addEventListener('DOMContentLoaded', function() {
    console.log('Main script loaded');

    let currentUser = null;

    function loadUser() {
        const userJson = sessionStorage.getItem('currentUser');
        if (userJson) {
            currentUser = JSON.parse(userJson);
            return true;
        }
        return false;
    }

    function updateDashboard() {
        console.log('Updating dashboard');
        if (currentUser) {
            document.getElementById('username').textContent = currentUser.username;
            document.getElementById('wallet').textContent = `${currentUser.wallet_address.substr(0, 6)}...${currentUser.wallet_address.substr(-4)}`;
            
            const GSX_TO_USDT_RATE = 120.9;
            // Format the balances
            if (currentUser.balance_gsx !== undefined) {
                // Format GSX balance
                const formattedGsx = currentUser.balance_gsx.toLocaleString();
            
                // Calculate USDT balance based on GSX balance
                const usdtBalance = currentUser.balance_gsx * GSX_TO_USDT_RATE;
            
                // Format USDT balance
                const formattedUsdt = usdtBalance.toLocaleString(undefined, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            
                // Update the balance display
                document.getElementById('balance').innerHTML = `BALANCE<br>${formattedGsx} GSX ($${formattedUsdt})`;
            } else {
                console.error('GSX balance not found in user data');
                document.getElementById('balance').innerHTML = 'Balance information unavailable';
            }
            
            updateTime();
        } else {
            console.log('No current user');
            window.location.href = 'index.html';
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
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        window.location.href = 'index.html';
    }

    // Add event listeners for dashboard buttons
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.id.replace('Button', '');
            console.log(`${action} action clicked`);
            
            if (action === 'deposit') {
                    window.location.href = 'deposit.html';
                } else if (action === 'send') {
                    window.location.href = 'send.html';
                } else {
                    alert(`${action.charAt(0).toUpperCase() + action.slice(1)} functionality coming soon!`);
                }
        });
    });

    // Check if we're on the dashboard page
    if (document.getElementById('dashboardPage')) {
        console.log('Dashboard page detected');
        if (loadUser()) {
            updateDashboard();
            setInterval(updateTime, 1000);
        } else {
            window.location.href = 'index.html';
        }
    } else {
        console.log('Not on dashboard page');
    }
});
