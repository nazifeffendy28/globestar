let currentUser = null;
let users = [];
let transactionHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]');

const GSX_TO_USDT_RATE = 204.49;
const USERS_STORAGE_KEY = 'users';
const CURRENT_USER_STORAGE_KEY = 'currentUser';

export async function initializeUserData() {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        } else {
            const response = await fetch('js/users.json');
            const data = await response.json();
            users = data.users;
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
        console.log('User data initialized');
    } catch (error) {
        console.error('Error initializing user data:', error);
    }
}

export function loadUser() {
    const userJson = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (userJson) {
        currentUser = JSON.parse(userJson);
        return true;
    }
    return false;
}

export function getCurrentUser() {
    if (!currentUser) {
        const userJson = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        if (userJson) {
            currentUser = JSON.parse(userJson);
        }
    }
    return currentUser;
}

export function setCurrentUser(user) {
    currentUser = user;
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    updateUserInUsers(user);
}

export function updateBalanceAfterTransaction(amount, isDeposit) {
    if (currentUser) {
        if (isDeposit) {
            currentUser.balance_gsx += amount;
        } else {
            currentUser.balance_gsx -= amount;
        }
        setCurrentUser(currentUser);
    }
}

export function updateBalanceDisplay() {
    const balanceAmount = document.getElementById('balanceAmount');
    const balanceUSD = document.getElementById('balanceUSD');
    if (balanceAmount && balanceUSD && currentUser) {
        const gsx = currentUser.balance_gsx.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        const usdt = (currentUser.balance_gsx * GSX_TO_USDT_RATE).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        balanceAmount.textContent = gsx;
        balanceUSD.textContent = usdt;
    }
}

function updateUserInUsers(updatedUser) {
    const index = users.findIndex(u => u.username === updatedUser.username);
    if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
}

export function logout() {
    currentUser = null;
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
}

export function getUsers() {
    console.log('Fetching users from localStorage');
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        console.log('Users retrieved from localStorage:', parsedUsers);
        return parsedUsers;
    }
    console.warn('No users found in localStorage, returning default users array');
    return users;
}


export function updateRecipientBalance(recipientAddress, amount) {
    const recipientIndex = users.findIndex(u => u.wallet_address.toLowerCase() === recipientAddress.toLowerCase());
    if (recipientIndex !== -1) {
        users[recipientIndex].balance_gsx += amount;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        console.log('Recipient balance updated:', users[recipientIndex]);
        
        // If the recipient is the current user, update currentUser as well
        if (currentUser && currentUser.wallet_address.toLowerCase() === recipientAddress.toLowerCase()) {
            currentUser.balance_gsx += amount;
            setCurrentUser(currentUser);
        }
    } else {
        console.log('Recipient not found for address:', recipientAddress);
    }
}

export async function refreshUserData() {
    if (currentUser) {
        const user = users.find(u => u.username === currentUser.username);
        if (user) {
            setCurrentUser(user);
            updateBalanceDisplay();
        }
    }
}

export function deductBalance(amount) {
    if (currentUser) {
        currentUser.balance_gsx -= amount;
        setCurrentUser(currentUser);
        return true;
    }
    return false;
}

export function addBalance(address, amount) {
    console.log(`Attempting to add ${amount} GSX to address ${address}`);
    const users = getUsers();  // Make sure we're using the most up-to-date user data
    console.log('Current users:', users);

    const userIndex = users.findIndex(u => u.wallet_address.toLowerCase() === address.toLowerCase());
    console.log(`User index for address ${address}: ${userIndex}`);

    if (userIndex !== -1) {
        console.log(`User found. Current balance: ${users[userIndex].balance_gsx}`);
        users[userIndex].balance_gsx += amount;
        console.log(`Updated balance: ${users[userIndex].balance_gsx}`);
        
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        console.log('Updated users saved to localStorage');

        if (currentUser && currentUser.wallet_address.toLowerCase() === address.toLowerCase()) {
            currentUser.balance_gsx += amount;
            setCurrentUser(currentUser);
            console.log('Current user balance updated');
        }
        return true;
    }
    console.error(`User not found for address: ${address}`);
    return false;
}

export function addTransaction(transaction, userId) {
    const key = `transactionHistory_${userId}`;
    const transactions = JSON.parse(localStorage.getItem(key) || '[]');
    transactions.push(transaction);
    localStorage.setItem(key, JSON.stringify(transactions));
}

export function getTransactionHistory(userId) {
    const key = `transactionHistory_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}
  