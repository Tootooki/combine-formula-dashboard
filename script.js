document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

async function fetchData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Data not found');
        const data = await response.json();
        
        renderDashboard(data);
    } catch (error) {
        document.getElementById('dashboard-container').innerHTML = `
            <div style="text-align:center; padding: 3rem; color: #ef4444;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h2>Failed to load data</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function parseCurrency(str) {
    if (!str && str !== 0) return 0;
    // Handle (1,000.50) format which represents negative in some financial cases, though here we have -$
    const cleanStr = String(str).replace(/[^\d.-]/g, '');
    return parseFloat(cleanStr) || 0;
}

function determineStyleClass(val) {
    if (val === undefined || val === null || val === '') return 'cell-muted';
    const str = String(val);
    
    // Specifically format zeroes or exact zero matches
    if (str === '0' || str === '0%' || str === '$0.00' || str === '0.00%') {
        return 'cell-muted';
    }
    
    // Check if it's a financial/percentage number
    if (str.includes('$') || str.includes('%')) {
        const num = parseCurrency(str);
        if (num > 0) return 'cell-positive';
        if (num < 0 || str.includes('-')) return 'cell-negative';
        return 'cell-muted'; 
    }
    
    return ''; // Normal text/number
}

function determineSummaryClass(val) {
    const num = parseCurrency(val);
    if(num > 0) return 'positive';
    if(num < 0 || String(val).includes('-')) return 'negative';
    return 'neutral';
}

function renderDashboard(data) {
    const container = document.getElementById('dashboard-container');
    const dateEl = document.getElementById('dashboard-date');
    
    if (data.date) {
        dateEl.innerHTML = `<i class="fa-regular fa-calendar"></i> Reporting Date: ${data.date}`;
    }

    container.innerHTML = '';

    data.groups.forEach(group => {
        // Headers setup
        let salesIdx = -1, profitIdx = -1;
        
        // Let's find specific columns to pull totals from
        group.headers.forEach((h, i) => {
            const hStr = h?.toString().toUpperCase().trim() || '';
            if (hStr === 'SALES' && salesIdx === -1) salesIdx = i; // First SALES usually is count
            if (hStr === 'PROFIT') profitIdx = i; // Last profit column usually is total profit
        });

        const totalsRow = group.totals;
        
        // Extract stats or just show placeholder
        const profitRaw = profitIdx > -1 ? (totalsRow[profitIdx] || '') : '';
        const salesRaw = salesIdx > -1 ? (totalsRow[salesIdx] || '') : '';
        
        const groupEl = document.createElement('div');
        groupEl.className = 'group-container';
        
        // Create Header
        const headerHTML = `
            <div class="group-header" onclick="this.parentElement.classList.toggle('collapsed')">
                <div class="group-title">
                    <i class="fa-solid fa-chevron-down toggle-icon"></i>
                    <h2>${group.name.replace('_TOTALS', '')}</h2>
                </div>
                <div class="group-totals-summary">
                    ${salesRaw ? `
                    <div class="summary-stat">
                        <span class="label">Sales Count</span>
                        <span class="val ${determineSummaryClass(salesRaw)}">${salesRaw}</span>
                    </div>` : ''}
                    ${profitRaw ? `
                    <div class="summary-stat">
                        <span class="label">Total Profit</span>
                        <span class="val ${determineSummaryClass(profitRaw)}">${profitRaw}</span>
                    </div>` : ''}
                </div>
            </div>
        `;

        // Create Table
        let tableHTML = `<div class="group-content"><div class="table-scroll"><table><thead><tr>`;
        
        // Render headers. Skipping 'IMG' / Col A (index 0) because we don't have images
        const startIndex = 1; 
        
        for (let i = startIndex; i < group.headers.length; i++) {
            tableHTML += `<th>${group.headers[i] || ''}</th>`;
        }
        tableHTML += `</tr></thead><tbody>`;

        // Render Data rows
        group.data.forEach(row => {
            // skip empty rows completely
            if (!row || row.length === 0 || !row[1] || row[1].trim() === '') return;

            tableHTML += `<tr>`;
            for (let i = startIndex; i < group.headers.length; i++) {
                // If it is 0, render it as empty or muted "0"
                let cellVal = row[i] !== undefined ? row[i] : '';
                if (cellVal === '0' || cellVal === '0%' || cellVal === '0.00%' || cellVal === '$0.00') {
                    cellVal = '-';
                }

                const cellClass = i > startIndex ? determineStyleClass(row[i]) : ''; // Only apply color-coding to stats
                tableHTML += `<td class="${cellClass}">${cellVal}</td>`;
            }
            tableHTML += `</tr>`;
        });

        tableHTML += `</tbody></table></div></div>`;
        
        groupEl.innerHTML = headerHTML + tableHTML;
        container.appendChild(groupEl);
    });
}
