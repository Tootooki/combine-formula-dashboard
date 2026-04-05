document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

let globalImages = {};

async function fetchData() {
    try {
        const response = await fetch(`data.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Data not found');
        const data = await response.json();
        
        globalImages = data.images || {};
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
    const cleanStr = String(str).replace(/[^\d.-]/g, '');
    return parseFloat(cleanStr) || 0;
}

function determineStyleClass(val) {
    if (val === undefined || val === null || val === '') return 'cell-muted';
    const str = String(val);
    
    if (str === '0' || str === '0%' || str === '$0.00' || str === '0.00%') {
        return 'cell-muted';
    }
    
    if (str.includes('$') || str.includes('%')) {
        const num = parseCurrency(str);
        if (num > 0) return 'cell-positive';
        if (num < 0 || str.includes('-')) return 'cell-negative';
        return 'cell-muted'; 
    }
    
    return '';
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
        let salesIdx = -1, profitIdx = -1;
        
        group.headers.forEach((h, i) => {
            const hStr = h?.toString().toUpperCase().trim() || '';
            if (hStr === 'SALES' && salesIdx === -1) salesIdx = i;
            if (hStr === 'PROFIT') profitIdx = i;
        });

        const totalsRow = group.totals;
        
        const profitRaw = profitIdx > -1 ? (totalsRow[profitIdx] || '') : '';
        const salesRaw = salesIdx > -1 ? (totalsRow[salesIdx] || '') : '';
        
        const groupEl = document.createElement('div');
        groupEl.className = 'group-container';
        
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

        let tableHTML = `<div class="group-content"><div class="table-scroll"><table><thead><tr>`;
        
        const startIndex = 0; 
        
        for (let i = startIndex; i < group.headers.length; i++) {
            tableHTML += `<th>${group.headers[i] || ''}</th>`;
        }
        tableHTML += `</tr></thead><tbody>`;

        group.data.forEach(row => {
            if (!row || row.length === 0 || !row[1] || row[1].trim() === '') return;
            const currentSku = row[1];

            tableHTML += `<tr>`;
            for (let i = startIndex; i < group.headers.length; i++) {
                let cellVal = row[i] !== undefined ? row[i] : '';

                if (i === 0) {
                    if (globalImages[currentSku]) {
                        cellVal = `<div class="img-wrapper"><img src="${globalImages[currentSku]}" alt="Product" /></div>`;
                    } else {
                        cellVal = `<div class="img-placeholder"><i class="fa-solid fa-box-open"></i></div>`;
                    }
                }

                if (cellVal === '0' || cellVal === '0%' || cellVal === '0.00%' || cellVal === '$0.00') {
                    cellVal = '-';
                }

                const cellClass = i > 1 ? determineStyleClass(row[i]) : ''; 
                tableHTML += `<td class="${cellClass}">${cellVal}</td>`;
            }
            tableHTML += `</tr>`;
        });

        tableHTML += `</tbody></table></div></div>`;
        
        groupEl.innerHTML = headerHTML + tableHTML;
        container.appendChild(groupEl);
    });
}
