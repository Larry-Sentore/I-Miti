// Search functionality — listens for form submission and fetches matching pharmacies.

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('#search-form');
    if (!searchForm) return;

    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const medicine = document.querySelector('input[name="medicine"]')?.value?.trim();
        const latitude = document.querySelector('input[name="latitude"]')?.value?.trim();
        const longitude = document.querySelector('input[name="longitude"]')?.value?.trim();

        if (!medicine || !latitude || !longitude) {
            alert(t('alert_fill_all_fields'));
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
            alert(t('alert_search_error') + (err.message || err));
        }
    });

    function displayResults(results) {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>' + t('result_no_pharmacies') + '</p>';
            return;
        }
        results.forEach(pharmacy => {
            const pharmacyDiv = document.createElement('div');
            pharmacyDiv.classList.add('pharmacy-result');
            const mapsUrl = `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`;
            pharmacyDiv.innerHTML = `
                <h3>${pharmacy.name}</h3>
                <p>${t('result_label_address')} ${pharmacy.address}</p>
                <p>${t('result_label_phone')} ${pharmacy.number}</p>
                <p>${t('result_label_distance')} ${pharmacy.distance.toFixed(2)} ${t('result_label_km')}</p>
                <a href="${mapsUrl}" target="_blank" class="directions-btn">${t('result_directions_btn')}</a>
            `;
            resultsContainer.appendChild(pharmacyDiv);
        });
    }
});
