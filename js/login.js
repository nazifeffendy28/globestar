document.addEventListener('DOMContentLoaded', function() {
    console.log('Login script loaded');

    const users = [
        { id: 1, username: "globestar_liquidity", password: "liquid123", wallet_address: "0xAf1844bfeqRr1u25", balance_gsx: 1012924, balance_usdt: 122462511.6 },
        { id: 2, username: "globestar_developer", password: "development123", wallet_address: "0xAf1845LyMnRhn3j0", balance_gsx: 215225, balance_usdt: 26020702.5 },
        { id: 3, username: "bitget_exchange", password: "63TBitGet2024!", wallet_address: "0xAf1841sXb1tG3T1f", balance_gsx: 1050591, balance_usdt: 127016476.1 },
        { id: 4, username: "mexc_exchange", password: "MEXCtothemoon", wallet_address: "0xAf1843G5JjTafk0t", balance_gsx: 5048, balance_usdt: 610303.2 }
    ];

    const loginButton = document.getElementById('loginButton');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    function login() {
        console.log('Login function called');
        const username = usernameInput.value;
        const password = passwordInput.value;
        console.log('Entered username:', username);
        console.log('Entered password:', password);

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            console.log('User found:', user);
            console.log('Login successful');
            // Store user data in sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            console.log('User not found');
            showError('Invalid username or password');
        }
    }

    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = 'red';
        errorElement.style.marginTop = '10px';

        const container = document.querySelector('.container');
        const existingError = container.querySelector('.error-message');
        if (existingError) {
            container.removeChild(existingError);
        }
        container.appendChild(errorElement);
    }

    if (loginButton) {
        loginButton.addEventListener('click', login);
    } else {
        console.error('Login button not found');
    }

    // Add event listener for Enter key press
    document.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            login();
        }
    });
});