// this is where the login logic will be implemented
// the login will check the license certificate number an if it is present in the database, the user will be logged in and redirected to the pharmacy.html page
// After logging in, the user will be redirected to pharmacy.html to view and update their stock information

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#login form');
  if (!form) return;
  else {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
        const certificate = document.getElementById('certificate')?.value?.trim();
        // check if the certificate number is present in the database
        try {
          const res = await fetch('/login_pharmacy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ certificate })
          });
          if (!res.ok) {
            const errorResponse = await res.json().catch(() => ({}));
            const message = errorResponse.detail || errorResponse.message || 'Invalid license certificate number.';
            throw new Error(message);
          }
          const data = await res.json();
          localStorage.setItem('currentPharmacyID', data.pharmacyID);
          alert('Login successful!');
          window.location.href = 'pharmacy.html';
        } catch (err) {
          console.error(err);
          alert('Login failed: ' + (err.message || err));
        }
      });

      form.addEventListener('')
    }
  });

