document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    let users = [];
    const networkSelect = document.getElementById('networkSelect');
    const walletAddressInput = document.getElementById('walletAddressInput');
    const amountInput = document.getElementById('amountInput');
    const amountOutput = document.getElementById('amountOutput');
    const sendButton = document.getElementById('sendButton');
    const backButton = document.getElementById('backButton');
    const inquiryPopup = document.getElementById('inquiryPopup');
    const resultPopup = document.getElementById('resultPopup');
    const inquiryDetails = document.getElementById('inquiryDetails');
    const confirmSend = document.getElementById('confirmSend');
    const cancelSend = document.getElementById('cancelSend');
    const closeResult = document.getElementById('closeResult');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const GSX_TO_USDT_RATE = 120.9;
    const MIN_GSX = 0.05;
    const NETWORK_FEE_RATE = 0.00025; // 0.025%

    let currentTransaction = {};

    function loadUser() {
        const userJson = sessionStorage.getItem('currentUser');
        if (userJson) {
            currentUser = JSON.parse(userJson);
            return true;
        }
        return false;
    }

    function loadUsers() {
        return fetch('js/users.json')
            .then(response => response.json())
            .then(data => {
                users = data.users;
                console.log('Users data loaded successfully');
            })
            .catch(error => console.error('Error loading users:', error));
    }

    function updateUserInfo() {
        if (currentUser) {
            document.getElementById('username').textContent = currentUser.username;
            document.getElementById('wallet').textContent = `${currentUser.wallet_address.substr(0, 6)}...${currentUser.wallet_address.substr(-4)}`;
            updateTime();
        } else {
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

    function calculateFees(amount) {
        const networkFee = amount * NETWORK_FEE_RATE;
        const totalAmount = amount + networkFee;
        return {
            networkFee: networkFee,
            networkFeeUSDT: networkFee * GSX_TO_USDT_RATE,
            totalAmount: totalAmount,
            totalAmountUSDT: totalAmount * GSX_TO_USDT_RATE
        };
    }

    function updateApproxAmount() {
        if (!networkSelect.value) {
            document.getElementById('network-error').style.display = 'block';
            amountOutput.value = '';
            return;
        }
        document.getElementById('network-error').style.display = 'none';

        const inputValue = parseFloat(amountInput.value);
        if (isNaN(inputValue) || inputValue <= 0) {
            amountOutput.value = '';
            return;
        }

        const result = (inputValue * GSX_TO_USDT_RATE).toFixed(4);
        amountOutput.value = result;

        validateInput();
    }

    function validateInput() {
        const value = parseFloat(amountInput.value);
        const errorElement = document.getElementById('amount-error');
        
        if (value < MIN_GSX) {
            errorElement.textContent = `Minimum Send is ${MIN_GSX} GSX`;
            errorElement.style.display = 'block';
            return false;
        }

        const fees = calculateFees(value);
        if (fees.totalAmount > currentUser.balance_gsx) {
            errorElement.textContent = `Insufficient balance. Maximum you can send is ${(currentUser.balance_gsx / (1 + NETWORK_FEE_RATE)).toFixed(4)} GSX`;
            errorElement.style.display = 'block';
            return false;
        }

        errorElement.style.display = 'none';
        return true;
    }

    function validateWalletAddress() {
        const address = walletAddressInput.value.trim();
        const addressError = document.getElementById('address-error');
        
        if (users.length === 0) {
            console.error('Users data not loaded. Unable to validate wallet address.');
            return false;
        }

        // Check if the address exists in our users list
        const userExists = users.some(user => user.wallet_address.toLowerCase() === address.toLowerCase());
        
        if (!userExists) {
            addressError.textContent = "Wallet address not found";
            addressError.style.display = 'block';
            return false;
        }
        
        addressError.style.display = 'none';
        return true;
    }

    function showInquiryPopup() {
        if (!validateWalletAddress() || !validateInput()) {
            return;
        }
        
        const amount = parseFloat(amountInput.value);
        const fees = calculateFees(amount);
        const inquiryId = Date.now().toString();
    
        currentTransaction = {
            inquiryId: inquiryId,
            fromAddress: currentUser.wallet_address,
            toAddress: walletAddressInput.value,
            amount: amount,
            networkFee: fees.networkFee,
            totalAmount: fees.totalAmount,
            network: networkSelect.value,
            timestamp: new Date().toISOString()
        };
    
        inquiryDetails.innerHTML = `
            <p>From Address <span>${currentTransaction.fromAddress}</span></p>
            <p>To Address <span>${currentTransaction.toAddress}</span></p>
            <p>Amount <span>${currentTransaction.amount.toFixed(4)} GSX</span></p>
            <p>Network Fee <span>${currentTransaction.networkFee.toFixed(4)} GSX</span></p>
            <p><span>≈ ${fees.networkFeeUSDT.toFixed(4)} USDT</span></p>
            <p>Network <span>${currentTransaction.network}</span></p>
            <p>Inquiry ID <span>${currentTransaction.inquiryId}</span></p>
            <p>Total Amount Send <span>${currentTransaction.totalAmount.toFixed(4)} GSX</span></p>
            <p><span>≈ ${fees.totalAmountUSDT.toFixed(4)} USDT</span></p>
            <p>Time (UTC+7) <span>${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}</span></p>
        `;
    
        inquiryPopup.classList.add('active');
    }

    function showLoadingSpinner() {
        loadingSpinner.classList.add('active');
    }

    function hideLoadingSpinner() {
        loadingSpinner.classList.remove('active');
    }

    function processSend() {
        showLoadingSpinner();
        inquiryPopup.classList.remove('active');

        let isResolved = false;
        const timeoutDuration = 15000; // 15 seconds

        const approvalProcess = new Promise((resolve) => {
            setTimeout(() => {
                if (!isResolved) {
                    const approval = confirm("Backend Approval Simulation: Click OK to approve the send, or Cancel to reject.");
                    resolve(approval);
                }
            }, 3000);
        });

        const timeout = new Promise((resolve) => {
            setTimeout(() => {
                if (!isResolved) {
                    resolve(false);
                }
            }, timeoutDuration);
        });

        Promise.race([approvalProcess, timeout])
            .then((result) => {
                isResolved = true;
                hideLoadingSpinner();
                handleSendResult(result);
            });
    }

    function handleSendResult(isSuccessful) {
        currentTransaction.status = isSuccessful ? 'successful' : 'failed';
        currentTransaction.transactionId = Date.now().toString();

        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        transactions.push(currentTransaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));

        if (isSuccessful) {
            updateUserBalance();
        }

        const resultTitle = document.getElementById('resultTitle');
        const resultDetails = document.getElementById('resultDetails');

        resultTitle.textContent = isSuccessful ? 'Send Successful' : 'Send Failed';
        resultDetails.innerHTML = `
            <p>From Address <span>${currentTransaction.fromAddress}</span></p>
            <p>To Address <span>${currentTransaction.toAddress}</span></p>
            <p>Network <span>${currentTransaction.network}</span></p>
            <p>Amount GSX <span>${currentTransaction.amount.toFixed(4)}</span></p>
            <p>Amount USDT <span>${(currentTransaction.amount * GSX_TO_USDT_RATE).toFixed(4)}</span></p>
            <p>Network Fee <span>${currentTransaction.networkFee.toFixed(4)} GSX</span></p>
            <p><span>≈ ${(currentTransaction.networkFee * GSX_TO_USDT_RATE).toFixed(4)} USDT</span></p>
            <p>Total Amount Send <span>${currentTransaction.totalAmount.toFixed(4)} GSX</span></p>
            <p><span>≈ ${(currentTransaction.totalAmount * GSX_TO_USDT_RATE).toFixed(4)} USDT</span></p>
            <p>Transaction ID <span>${currentTransaction.transactionId}</span></p>
        `;

        document.querySelector('#resultPopup .timestamp').textContent = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }) + ' (UTC+7)';
        resultPopup.classList.add('active');
    }

    function updateUserBalance() {
        currentUser.balance_gsx -= currentTransaction.totalAmount;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Event Listeners
    networkSelect.addEventListener('change', updateApproxAmount);
    amountInput.addEventListener('input', updateApproxAmount);
    walletAddressInput.addEventListener('input', validateWalletAddress);
    backButton.addEventListener('click', () => window.location.href = 'dashboard.html');
    sendButton.addEventListener('click', () => {
        if (validateInput() && validateWalletAddress() && networkSelect.value) {
            showInquiryPopup();
        }
    });
    confirmSend.addEventListener('click', processSend);
    cancelSend.addEventListener('click', () => inquiryPopup.classList.remove('active'));
    closeResult.addEventListener('click', () => {
        resultPopup.classList.remove('active');
        window.location.href = 'dashboard.html';
    });

    // Initialize
    if (loadUser()) {
        updateUserInfo();
        setInterval(updateTime, 1000);
        
        // Load users data after successful authentication
        loadUsers().then(() => {
            console.log('Initialization complete');
            // Any additional setup that depends on users data can go here
        });
    } else {
        console.log('User not authenticated, redirecting to login page');
        window.location.href = 'index.html';
    }

    updateApproxAmount();
});
