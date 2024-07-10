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
            document.getElementById('balance').innerHTML = `BALANCE<br>${currentUser.balance_gsx.toFixed(4)} GSX ($${currentUser.balance_usdt.toFixed(2)})`;
            updateTime();
        } else {
            console.log('No current user');
            window.location.href = 'login.html';
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
        window.location.href = 'login.html';
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
            // Add your action handling logic here
        });
    });

    // Check if we're on the dashboard page
    if (document.getElementById('dashboardPage')) {
        console.log('Dashboard page detected');
        if (loadUser()) {
            updateDashboard();
            setInterval(updateTime, 1000);
        } else {
            window.location.href = 'login.html';
        }
    } else {
        console.log('Not on dashboard page');
    }
});