document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    const depositMethod = document.getElementById('depositMethod');
    const amountInput = document.getElementById('amountInput');
    const amountOutput = document.getElementById('amountOutput');
    const flipButton = document.getElementById('flipButton');
    const inputLabel = document.getElementById('inputLabel');
    const outputLabel = document.getElementById('outputLabel');
    const inputError = document.getElementById('input-error');
    const methodError = document.getElementById('method-error');
    const depositButton = document.getElementById('depositButton');
    const backButton = document.getElementById('backButton');
    const inquiryPopup = document.getElementById('inquiryPopup');
    const resultPopup = document.getElementById('resultPopup');
    const inquiryDetails = document.getElementById('inquiryDetails');
    const confirmDeposit = document.getElementById('confirmDeposit');
    const cancelDeposit = document.getElementById('cancelDeposit');
    const closeResult = document.getElementById('closeResult');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const GSX_TO_USDT_RATE = 120.9;
    const MIN_GSX = 0.05;
    const MIN_USDT = 10;
    const ADMIN_FEE_RATE = 0.0002; // 0.02%

    let isGSXMode = true;
    let currentTransaction = {};

    function loadUser() {
        const userJson = sessionStorage.getItem('currentUser');
        if (userJson) {
            currentUser = JSON.parse(userJson);
            return true;
        }
        return false;
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

    function calculateFees(amount, isGSX) {
        const adminFee = amount * ADMIN_FEE_RATE;
        const totalAmount = amount - adminFee;
        
        if (isGSX) {
            return {
                adminFee: adminFee,
                adminFeeUSDT: adminFee * GSX_TO_USDT_RATE,
                totalAmount: totalAmount,
                totalAmountUSDT: totalAmount * GSX_TO_USDT_RATE
            };
        } else {
            return {
                adminFee: adminFee,
                adminFeeGSX: adminFee / GSX_TO_USDT_RATE,
                totalAmount: totalAmount,
                totalAmountGSX: totalAmount / GSX_TO_USDT_RATE
            };
        }
    }

    function updateApproxAmount() {
        if (!depositMethod.value) {
            methodError.style.display = 'block';
            amountOutput.value = '';
            return;
        }
        methodError.style.display = 'none';

        const inputValue = parseFloat(amountInput.value);
        if (isNaN(inputValue) || inputValue <= 0) {
            amountOutput.value = '';
            return;
        }

        let result;
        if (isGSXMode) {
            result = (inputValue * GSX_TO_USDT_RATE).toFixed(4);
        } else {
            result = (inputValue / GSX_TO_USDT_RATE).toFixed(4);
        }
        amountOutput.value = result;

        validateInput();
    }

    function validateInput() {
        const value = parseFloat(amountInput.value);
        const minValue = isGSXMode ? MIN_GSX : MIN_USDT;
        const errorMessage = isGSXMode ? `Minimum Deposit is ${MIN_GSX} GSX` : `Minimum Deposit is ${MIN_USDT} USDT`;

        inputError.textContent = errorMessage;
        inputError.style.display = value < minValue ? 'block' : 'none';
        return value >= minValue;
    }

    function flipMode() {
        isGSXMode = !isGSXMode;
        if (isGSXMode) {
            inputLabel.textContent = 'Amount GSX';
            outputLabel.textContent = 'Approx. USDT';
            amountInput.step = '0.0001';
            amountInput.min = MIN_GSX;
        } else {
            inputLabel.textContent = 'Amount USDT';
            outputLabel.textContent = 'Approx. GSX';
            amountInput.step = '0.01';
            amountInput.min = MIN_USDT;
        }
        const tempValue = amountInput.value;
        amountInput.value = amountOutput.value;
        amountOutput.value = tempValue;
        validateInput();
    }

    function showInquiryPopup() {
        const amount = parseFloat(amountInput.value);
        const fees = calculateFees(amount, isGSXMode);
        const inquiryId = Date.now().toString();

        currentTransaction = {
            inquiryId: inquiryId,
            depositMethod: depositMethod.value,
            toAddress: currentUser.wallet_address,
            amount: amount,
            currency: isGSXMode ? 'GSX' : 'USDT',
            adminFee: fees.adminFee,
            adminFeeCurrency: isGSXMode ? 'GSX' : 'USDT',
            totalAmount: fees.totalAmount,
            totalAmountOther: isGSXMode ? fees.totalAmountUSDT : fees.totalAmountGSX,
            timestamp: new Date().toISOString()
        };

        inquiryDetails.innerHTML = `
            <p>Deposit Method <span>${currentTransaction.depositMethod}</span></p>
            <p>To Address <span>${currentTransaction.toAddress}</span></p>
            <p>Amount <span>${currentTransaction.amount.toFixed(4)} ${currentTransaction.currency}</span></p>
            <p>Admin Fee <span>${currentTransaction.adminFee.toFixed(4)} ${currentTransaction.currency}</span></p>
            <p>Inquiry ID <span>${currentTransaction.inquiryId}</span></p>
            <p>Total Amount Received <span>${currentTransaction.totalAmount.toFixed(4)} ${currentTransaction.currency}</span></p>
            <p><span>≈ ${currentTransaction.totalAmountOther.toFixed(4)} ${isGSXMode ? 'USDT' : 'GSX'}</span></p>
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

    async function processDeposit() {
        showLoadingSpinner();
        inquiryPopup.classList.remove('active');

        console.log('Awaiting manual approval (Y/N):');
        const approval = await new Promise(resolve => {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            readline.question('', ans => {
                readline.close();
                resolve(ans.toLowerCase() === 'y');
            });
        });

        hideLoadingSpinner();
        handleDepositResult(approval);
    }

    function handleDepositResult(isSuccessful) {
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

        resultTitle.textContent = isSuccessful ? 'Deposit Successful' : 'Deposit Failed';
        resultDetails.innerHTML = `
            <p>Deposit Method <span>${currentTransaction.depositMethod}</span></p>
            <p>To Address <span>${currentTransaction.toAddress}</span></p>
            <p>Deposit In <span>${currentTransaction.currency}</span></p>
            <p>Amount ${currentTransaction.currency} <span>${currentTransaction.amount.toFixed(4)}</span></p>
            <p>Admin Fee <span>${currentTransaction.adminFee.toFixed(4)} ${currentTransaction.currency}</span></p>
            <p><span>≈ ${(isGSXMode ? currentTransaction.adminFee * GSX_TO_USDT_RATE : currentTransaction.adminFee / GSX_TO_USDT_RATE).toFixed(4)} ${isGSXMode ? 'USDT' : 'GSX'}</span></p>
            <p>Total Amount <span>${currentTransaction.totalAmount.toFixed(4)} ${currentTransaction.currency}</span></p>
            <p><span>≈ ${currentTransaction.totalAmountOther.toFixed(4)} ${isGSXMode ? 'USDT' : 'GSX'}</span></p>
            <p>Transaction ID <span>${currentTransaction.transactionId}</span></p>
        `;

        resultPopup.classList.add('active');
    }

    function updateUserBalance() {
        if (isGSXMode) {
            currentUser.balance_gsx += currentTransaction.totalAmount;
        } else {
            currentUser.balance_usdt += currentTransaction.totalAmount;
        }
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Event Listeners
    depositMethod.addEventListener('change', updateApproxAmount);
    amountInput.addEventListener('input', updateApproxAmount);
    flipButton.addEventListener('click', flipMode);
    backButton.addEventListener('click', () => window.location.href = 'dashboard.html');
    depositButton.addEventListener('click', () => {
        if (validateInput() && depositMethod.value) {
            showInquiryPopup();
        }
    });
    confirmDeposit.addEventListener('click', processDeposit);
    cancelDeposit.addEventListener('click', () => inquiryPopup.classList.remove('active'));
    closeResult.addEventListener('click', () => {
        resultPopup.classList.remove('active');
        window.location.href = 'dashboard.html';
    });

    // Initialize
    if (loadUser()) {
        updateUserInfo();
        setInterval(updateTime, 1000);
    } else {
        window.location.href = 'index.html';
    }

    updateApproxAmount();
});