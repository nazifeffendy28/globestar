import { 
    getCurrentUser, 
    setCurrentUser, 
    updateBalanceDisplay, 
    getUsers, 
    updateRecipientBalance, 
    deductBalance, 
    addBalance,
    addTransaction  // Add this line
} from './balance-management.js';

document.addEventListener('DOMContentLoaded', function() {
    const GSX_TO_USDT_RATE = 120.9;
    const MIN_GSX = 0.05;
    const NETWORK_FEE_RATE = 0.00025; // 0.025%

    let currentUser = getCurrentUser();
    let currentTransaction = {};

    const elements = {
        networkSelect: document.getElementById('networkSelect'),
        walletAddressInput: document.getElementById('walletAddressInput'),
        amountInput: document.getElementById('amountInput'),
        amountOutput: document.getElementById('amountOutput'),
        sendButton: document.getElementById('sendButton'),
        backButton: document.getElementById('backButton'),
        inquiryPopup: document.getElementById('inquiryPopup'),
        resultPopup: document.getElementById('resultPopup'),
        inquiryDetails: document.getElementById('inquiryDetails'),
        confirmSend: document.getElementById('confirmSend'),
        cancelSend: document.getElementById('cancelSend'),
        closeResult: document.getElementById('closeResult'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        username: document.getElementById('username'),
        wallet: document.getElementById('wallet_address'),
        time: document.getElementById('time'),
        amountError: document.getElementById('amount-error'),
        addressError: document.getElementById('address-error'),
        resultTitle: document.getElementById('resultTitle'),
        resultDetails: document.getElementById('resultDetails'),
        resultTimestamp: document.querySelector('#resultPopup .timestamp')
    };

    function initialize() {
        currentUser = getCurrentUser();
        if (!currentUser) {
            window.location.href = 'index.html';
            return;
        }
        updateUserInfo();
        setupNetworkSelect();
        setupEventListeners();
        setInterval(updateTime, 1000);
    }

    function updateUserInfo() {
        if (elements.username) elements.username.textContent = currentUser.username;
        if (elements.wallet) elements.wallet.textContent = `${currentUser.wallet_address.substr(0, 6)}...${currentUser.wallet_address.substr(-4)}`;
        updateTime();
        updateBalanceDisplay();
    }

    function updateTime() {
        if (elements.time) {
            const now = new Date();
            const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' };
            elements.time.textContent = now.toLocaleTimeString('en-US', options) + ' (UTC+7) ' + now.toLocaleDateString('en-US');
        }
    }

    function setupNetworkSelect() {
        if (elements.networkSelect) {
            elements.networkSelect.innerHTML = '<option value="GSX">GSX</option>';
            elements.networkSelect.value = 'GSX';
            elements.networkSelect.disabled = true;
        }
    }

    function setupEventListeners() {
        if (elements.amountInput) elements.amountInput.addEventListener('input', updateApproxAmount);
        if (elements.walletAddressInput) elements.walletAddressInput.addEventListener('input', validateWalletAddress);
        if (elements.backButton) elements.backButton.addEventListener('click', () => window.location.href = 'dashboard.html');
        if (elements.sendButton) elements.sendButton.addEventListener('click', handleSendClick);
        if (elements.confirmSend) elements.confirmSend.addEventListener('click', processSend);
        if (elements.cancelSend) elements.cancelSend.addEventListener('click', () => elements.inquiryPopup.classList.remove('active'));
        if (elements.closeResult) elements.closeResult.addEventListener('click', handleCloseResult);
    }

    function updateApproxAmount() {
        const inputValue = parseFloat(elements.amountInput.value);
        if (isNaN(inputValue) || inputValue <= 0) {
            elements.amountOutput.value = '';
            return;
        }
        const result = (inputValue * GSX_TO_USDT_RATE).toFixed(4);
        elements.amountOutput.value = result;
        validateInput();
    }

    function validateInput() {
        const value = parseFloat(elements.amountInput.value);
        const errorMessage = `Minimum Send is ${MIN_GSX} GSX`;
        if (elements.amountError) {
            elements.amountError.textContent = errorMessage;
            elements.amountError.style.display = value < MIN_GSX ? 'block' : 'none';
        }
        return value >= MIN_GSX;
    }

    function validateWalletAddress() {
        const address = elements.walletAddressInput.value.trim();
        const users = getUsers();
        
        const recipientExists = users.some(user => 
            user.wallet_address.toLowerCase() === address.toLowerCase() &&
            user.wallet_address.toLowerCase() !== currentUser.wallet_address.toLowerCase()
        );
        
        if (elements.addressError) {
            if (recipientExists) {
                elements.addressError.style.display = 'none';
                console.log('Valid recipient wallet address');
            } else if (address === currentUser.wallet_address) {
                elements.addressError.textContent = "Cannot send to your own address";
                elements.addressError.style.display = 'block';
            } else {
                elements.addressError.textContent = "Wallet address not found";
                elements.addressError.style.display = 'block';
            }
        }
        return recipientExists;
    }

    async function handleSendClick() {
        if (validateInput() && validateWalletAddress() && elements.networkSelect.value) {
            showInquiryPopup();
        }
    }

    function showInquiryPopup() {
        const amount = parseFloat(elements.amountInput.value);
        const fees = calculateFees(amount);
        currentTransaction = {
            inquiryId: Date.now().toString(),
            fromAddress: currentUser.wallet_address,
            toAddress: elements.walletAddressInput.value,
            amount: amount,
            networkFee: fees.networkFee,
            totalAmount: fees.totalAmount,
            network: elements.networkSelect.value,
            timestamp: new Date().toISOString()
        };
    
        elements.inquiryDetails.innerHTML = `
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
    
        elements.inquiryPopup.classList.add('active');
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

    async function processSend() {
        elements.loadingSpinner.classList.add('active');
        elements.inquiryPopup.classList.remove('active');
    
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
    
        try {
            const result = await Promise.race([approvalProcess, timeout]);
            isResolved = true;
    
            if (result) {
                // If approved, make the API call
                const response = await fetch('http://localhost:5000/api/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(currentTransaction),
                });
    
                const apiResult = await response.json();
    
                if (apiResult.status === 'success') {
                    handleSendResult(true, apiResult.senderBalance, apiResult.recipientBalance);
                } else {
                    handleSendResult(false, null, null, apiResult.message);
                }
            } else {
                handleSendResult(false, null, null, 'Transaction was not approved or timed out');
            }
        } catch (error) {
            console.error('Error processing send:', error);
            handleSendResult(false, null, null, error.message);
        } finally {
            elements.loadingSpinner.classList.remove('active');
        }
    }

    function handleSendResult(isSuccessful, newSenderBalance, newRecipientBalance, errorMessage = '') {
        console.log('handleSendResult called', { isSuccessful, newSenderBalance, newRecipientBalance, errorMessage });
        currentTransaction.status = isSuccessful ? 'successful' : 'failed';
        currentTransaction.transactionId = Date.now().toString();
    
        // Add transaction to history
        addTransaction({
            timestamp: new Date().toISOString(),
            type: 'Send',
            coin: 'GSX',
            amount: currentTransaction.amount,
            address: currentTransaction.toAddress,
            fromAddress: currentTransaction.fromAddress,
            network: currentTransaction.network,
            networkFee: currentTransaction.networkFee,
            totalAmount: currentTransaction.totalAmount,
            transactionId: currentTransaction.transactionId,
            status: isSuccessful ? 'Successful' : 'Failed'
        }, currentUser.id);
    
        // Update local storage
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        transactions.push(currentTransaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
    
        if (isSuccessful) {
            currentUser.balance_gsx = newSenderBalance;
            setCurrentUser(currentUser);
            updateBalanceDisplay();
        }
    
        if (elements.resultTitle) elements.resultTitle.textContent = isSuccessful ? 'Send Successful' : 'Send Failed';
        if (elements.resultDetails) {
            elements.resultDetails.innerHTML = `
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
                ${isSuccessful ? '' : `<p>Error: ${errorMessage}</p>`}
            `;
        }
    
        if (elements.resultTimestamp) {
            elements.resultTimestamp.textContent = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }) + ' (UTC+7)';
        }
    
        if (elements.resultPopup) {
            elements.resultPopup.classList.add('active');
        } else {
            console.error('Result popup element not found');
        }
    }

    function handleCloseResult() {
        elements.resultPopup.classList.remove('active');
        window.location.href = 'dashboard.html';
    }

    initialize();
});