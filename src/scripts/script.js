// Index page — registration modal logic.

        // Modal functionality
        const modal = document.getElementById('password-modal');
        const registerLink = document.getElementById('register-link');
        const closeBtn = document.getElementsByClassName('close')[0];
        const verifyBtn = document.getElementById('verify-btn');
        const passwordInput = document.getElementById('verification-password');
        const errorMessage = document.getElementById('error-message');

        // Show modal when register link is clicked
        registerLink.onclick = function(event) {
            event.preventDefault();
            modal.style.display = 'block';
            passwordInput.focus();
        }

        // Close modal when X is clicked
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            errorMessage.style.display = 'none';
            passwordInput.value = '';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
                errorMessage.style.display = 'none';
                passwordInput.value = '';
            }
        }

        // Verify password
        verifyBtn.onclick = async function() {
            const password = passwordInput.value.trim();

            try {
                const response = await fetch('/verify_registration_password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: password })
                });

                const result = await response.json();

                if (result.verified) {
                    if (result.token) {
                        sessionStorage.setItem('registrationToken', result.token);
                    }
                    window.location.href = 'pharegister.html';
                } else {
                    errorMessage.style.display = 'block';
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (error) {
                console.error('Verification error:', error);
                errorMessage.textContent = t('alert_verify_failed');
                errorMessage.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        }

        // Allow Enter key to submit
        passwordInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                verifyBtn.click();
            }
        });
