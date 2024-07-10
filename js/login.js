document.addEventListener('DOMContentLoaded', function() {
    console.log('Login script loaded');

    let users = [];

    async function loadUserData() {
        try {
            const response = await fetch('js/users.json');
            const data = await response.json();
            users = data.users;
            console.log('Users data loaded:', users);
            return true;
        } catch (error) {
            console.error('Error loading users data:', error);
            showError('Failed to load user data. Please refresh the page.');
            return false;
        }
    }
    
    const loginButton = document.getElementById('loginButton');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Set initial states
    loginButton.disabled = true;
    loadingIndicator.style.display = 'block';
    loginButton.textContent = 'Loading...';
    
    // Load user data when the page loads
    window.addEventListener('load', async () => {
        const dataLoaded = await loadUserData();
        if (dataLoaded) {
            loginButton.disabled = false;
            loadingIndicator.style.display = 'none';
            loginButton.textContent = 'Login';
        }
    });
    
    loginButton.addEventListener('click', login);
    
    function login() {
        console.log('Login function called');
        const username = usernameInput.value;
        const password = passwordInput.value;
        console.log('Entered username:', username);
        console.log('Entered password:', password);
    
        if (users.length === 0) {
            console.log('Users data not loaded yet');
            showError('User data is still loading. Please try again in a moment.');
            return;
        }
    
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