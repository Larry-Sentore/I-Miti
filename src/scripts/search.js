// This is where the search functionality is implemented. It listens for input in the search bar and filters the displayed items based on the search query.

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('#search-form');
    if (!searchForm) return;

    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const medicine = document.querySelector('input[name="medicine"]')?.value?.trim();
        const latitude = document.querySelector('input[name="latitude"]')?.value?.trim();
        const longitude = document.querySelector('input[name="longitude"]')?.value?.trim();

        if (!medicine || !latitude || !longitude) {
            alert('Please fill in all fields.');
            return;
        }

        try {
            const res = await fetch(`/search_medicine?medicine=${encodeURIComponent(medicine)}&latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`);
            if (!res.ok) {
                throw new Error('Search failed');
            }
            const results = await res.json();
            displayResults(results);
        } catch (err) {
            console.error(err);
            alert('Error searching for medicine: ' + (err.message || err));
        }
    });

    function displayResults(results) {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>No pharmacies found with the specified medicine.</p>';
            return;
        }
        results.forEach(pharmacy => {
            const pharmacyDiv = document.createElement('div');
            pharmacyDiv.classList.add('pharmacy-result');
            pharmacyDiv.innerHTML = `
                <h3>${pharmacy.name}</h3>
                <p>Address: ${pharmacy.address}</p>
                <p>Phone: ${pharmacy.number}</p>
                <p>Distance: ${pharmacy.distance.toFixed(2)} km</p>
            `;
            resultsContainer.appendChild(pharmacyDiv);
        });
