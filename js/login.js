import { setCurrentUser, getCurrentUser } from './balance-management.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.querySelector('button') || document.querySelector('.input-group button');
    const usernameInput = document.querySelector('input[type="text"]') || document.querySelector('.input-group:nth-child(1) input');
    const passwordInput = document.querySelector('input[type="password"]') || document.querySelector('.input-group:nth-child(2) input');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');

    console.log('Login button:', loginButton);
    console.log('Username input:', usernameInput);
    console.log('Password input:', passwordInput);
    console.log('Loading indicator:', loadingIndicator);
    console.log('Error message:', errorMessage);

    if (!loginButton) {
        console.error('Login button not found');
    }
    if (!usernameInput) {
        console.error('Username input not found');
    }
    if (!passwordInput) {
        console.error('Password input not found');
    }

    if (!loginButton || !usernameInput || !passwordInput) {
        console.error('Some required DOM elements are missing. Login functionality may not work correctly.');
        return;
    }

    loginButton.addEventListener('click', handleLogin);

    async function handleLogin() {
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showError('Please enter both username and password.');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                setCurrentUser(data.user);
                window.location.href = 'dashboard.html';
            } else {
                throw new Error(data.message || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError(error.message);
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    function showError(message) {
        console.error('Login error:', message);
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        } else {
            alert(message);  // Fallback to alert if errorMessage element is not found
        }
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }

    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
        window.location.href = 'dashboard.html';
    }
});