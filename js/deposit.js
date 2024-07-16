import { getCurrentUser, setCurrentUser, updateBalanceDisplay, addTransaction } from './balance-management.js';

document.addEventListener('DOMContentLoaded', async function() {
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

    const GSX_TO_USDT_RATE = 204.49;
    const MIN_GSX = 0.05;
    const MIN_USDT = 10;
    const ADMIN_FEE_RATE = 0.0002; // 0.02%

    let isGSXMode = true;
    let currentTransaction = {};

    async function initialize() {
        currentUser = getCurrentUser();
        if (currentUser) {
            updateUserInfo();
            setInterval(updateTime, 1000);
            updateApproxAmount();
        } else {
            console.log('User not authenticated, redirecting to login page');
            window.location.href = 'index.html';
            return;
        }
    }

    function updateUserInfo() {
        if (currentUser) {
            document.getElementById('username').textContent = currentUser.username;
            document.getElementById('wallet').textContent = `${currentUser.wallet_address.substr(0, 6)}...${currentUser.wallet_address.substr(-4)}`;
            updateTime();
            updateBalanceDisplay();
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

    function validateDepositMethod() {
        const methodError = document.getElementById('method-error');
        if (!depositMethod.value) {
            methodError.style.display = 'block';
            return false;
        } else {
            methodError.style.display = 'none';
            return true;
        }
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
    
        let isResolved = false;
        const timeoutDuration = 15000; // 15 seconds
    
        const approvalProcess = new Promise((resolve) => {
            setTimeout(() => {
                if (!isResolved) {
                    const approval = confirm("Backend Approval Simulation: Click OK to approve the deposit, or Cancel to reject.");
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
                const response = await fetch('http://localhost:5000/api/deposit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(currentTransaction),
                });
    
                const apiResult = await response.json();
    
                if (apiResult.status === 'success') {
                    handleDepositResult(true, apiResult.newBalance);
                } else {
                    handleDepositResult(false);
                }
            } else {
                // If not approved or timed out
                handleDepositResult(false);
            }
        } catch (error) {
            console.error('Error processing deposit:', error);
            handleDepositResult(false);
        } finally {
            hideLoadingSpinner();
        }
    }

    function handleDepositResult(isSuccessful, newBalance) {
        currentTransaction.status = isSuccessful ? 'successful' : 'failed';
        currentTransaction.transactionId = Date.now().toString();    
    
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        transactions.push(currentTransaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
    
        if (isSuccessful) {
            currentUser.balance_gsx = newBalance;
            setCurrentUser(currentUser);
            updateBalanceDisplay();
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

        document.querySelector('#resultPopup .timestamp').textContent = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }) + ' (UTC+7)';
        resultPopup.classList.add('active');

        addTransaction({
            timestamp: new Date().toISOString(),
            type: 'Deposit',
            coin: currentTransaction.currency,
            amount: currentTransaction.amount,
            address: currentTransaction.toAddress,
            transactionId: currentTransaction.transactionId,
            status: isSuccessful ? 'Successful' : 'Failed',
            depositMethod: currentTransaction.depositMethod
        }, currentUser.id);
    
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
    depositButton.addEventListener('click', () => {
        if (validateDepositMethod() && validateInput()) {
            showInquiryPopup();
        }
    })
    
    // Initialize the page
    initialize().catch(error => {
        console.error('Initialization error:', error);
        // Handle initialization error (e.g., show an error message to the user)
    });
});