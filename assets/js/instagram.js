(function() {
window.initInstagramDashboard = initInstagramDashboard;

// --- SUMMARY CARDS CONFIG ---
const summaryCardsConfig = [
    { label: "Total Followers", icon: "📈", iconClass: "blue", valueKey: "Total Followers" },
    { label: "Profile Visits", icon: "👁️", iconClass: "green", valueKey: "Profile Visits" },
    { label: "New Followers", icon: "🆕", iconClass: "yellow", valueKey: "New Followers" },
    { label: "Reach", icon: "👤", iconClass: "blue", valueKey: "Reach" }
];

// --- RENDER SUMMARY CARDS ---
function renderSummaryGrid(data) {
    const grid = document.getElementById('summary-grid');
    grid.innerHTML = `
        <div class="summary-card">
            <div class="summary-icon blue">📈</div>
            <div class="summary-content">
                <div class="summary-value">${data["Total Followers"]}</div>
                <div class="summary-label">Total Followers</div>
            </div>
        </div>
        <div class="summary-card">
            <div class="summary-icon green">👁️</div>
            <div class="summary-content">
                <div class="summary-value">${data["Profile Visits"]}</div>
                <div class="summary-label">Profile Visits</div>
            </div>
        </div>
        <div class="summary-card">
            <div class="summary-icon yellow">🆕</div>
            <div class="summary-content">
                <div class="summary-value">${data["New Followers"]}</div>
                <div class="summary-label">New Followers</div>
            </div>
        </div>
        <div class="summary-card">
            <div class="summary-icon blue">👤</div>
            <div class="summary-content">
                <div class="summary-value">${data["Reach"]}</div>
                <div class="summary-label">Reach</div>
            </div>
        </div>
    `;
}

// --- FETCH SUMMARY DATA ---
function fetchSummaryData() {
    const selectedYear = document.getElementById('year-filter').value;
    const selectedMonth = document.getElementById('month-filter').value;
    Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vT2kiIWReRCRxBpqVt_erAkPUDwSSItcd9vO63hSjRstfSrye-voOaMkSUGAHOJtmEdlBKLWgzTxzgg/pub?gid=1541324920&single=true&output=csv", {
        download: true,
        complete: function(results) {
            const rows = results.data;
            if (!rows || rows.length < 2) return;
            const header = rows[0];
            const idxYear = header.findIndex(h => h.trim().toLowerCase() === "year");
            const idxMonth = header.findIndex(h => h.trim().toLowerCase() === "month");
            const idxFollowers = header.findIndex(h => h.trim().toLowerCase().includes("total followers"));
            const idxPageViews = header.findIndex(h => h.trim().toLowerCase().includes("profile activity"));
            const idxNewFollowers = header.findIndex(h => h.trim().toLowerCase().includes("follows"));
            const idxUniqueVisitors = header.findIndex(h => h.trim().toLowerCase().includes("account reached"));

            function normalizeMonth(m) {
                return (m || "").toLowerCase().replace(/[\s\.,']/g, "").replace(/24|25/g, "");
            }

            // Filter rows by selected year
            let filteredRows = rows.slice(1).filter(row => {
                if (selectedYear === "all") return true;
                return row[idxYear] && row[idxYear].trim() === selectedYear;
            });

            // Filter rows by selected month (if not "all")
            let monthRows = filteredRows;
            if (selectedMonth !== "all") {
                monthRows = filteredRows.filter(row =>
                    normalizeMonth(row[idxMonth]) === normalizeMonth(selectedMonth)
                );
            }

            // 1. Total Followers logic
            let totalFollowers = 0;
            if (selectedMonth === "all") {
                // Find the row with the latest month in the year and use its followers value
                const calendarOrder = [
                    "january","february","march","april","may","june",
                    "july","august","september","october","november","december"
                ];
                let latestIdx = -1;
                let latestRow = null;
                filteredRows.forEach(row => {
                    let monthCell = (row[idxMonth] || "").toLowerCase().replace(/[\s\.,']/g, "");
                    monthCell = monthCell.replace(/(24|25)/g, "");
                    monthCell = monthCell.replace(/,/g, "");
                    const idx = calendarOrder.findIndex(m => monthCell.startsWith(m));
                    if (idx > latestIdx) {
                        latestIdx = idx;
                        latestRow = row;
                    }
                });
                totalFollowers = latestRow ? (Number(latestRow[idxFollowers]) || 0) : 0;
            } else {
                if (monthRows.length > 0) {
                    totalFollowers = Number(monthRows[0][idxFollowers]) || 0;
                } else {
                    totalFollowers = 0;
                }
            }

            // 2. Sums for other metrics (always sum for filtered rows, i.e., year+month or year)
            let pageViews = 0, newFollowers = 0, uniqueVisitors = 0;
            (selectedMonth === "all" ? filteredRows : monthRows).forEach(row => {
                pageViews += Number(row[idxPageViews]) || 0;
                newFollowers += Number(row[idxNewFollowers]) || 0;
                uniqueVisitors += Number(row[idxUniqueVisitors]) || 0;
            });

            // Prepare data for summary cards
            const data = {
                "Total Followers": totalFollowers.toLocaleString(),
                "Profile Visits": pageViews.toLocaleString(),
                "New Followers": newFollowers.toLocaleString(),
                "Reach": uniqueVisitors.toLocaleString()
            };
            console.log('Final Instagram Summary Data:', data);
            renderSummaryGrid(data);
        }
    });
}

// --- IMPRESSIONS & OTHER METRICS CARDS ---
function renderImpressionsCards(data) {
    // Set values for summary cards if needed
    document.getElementById('total-impressions-value').textContent = data.totalImpressions;
    document.getElementById('total-clicks-value').textContent = data.totalClicks;
    document.getElementById('total-reactions-value').textContent = data.totalReactions;
    document.getElementById('total-comments-value').textContent = data.totalComments;

    // Chartist options
    const lineOptions = {
        showArea: true,
        fullWidth: true,
        chartPadding: { right: 20, left: 10, top: 10, bottom: 10 },
        axisY: { onlyInteger: true, offset: 40 },
        axisX: { showGrid: true, showLabel: true }
    };

    // Render charts and store instances on DOM elements
    if (data.impressionsMonths && data.impressionsSeries) {
        const chart = new Chartist.Line('#chart-impressions', {
            labels: data.impressionsMonths,
            series: [data.impressionsSeries]
        }, lineOptions);
        document.querySelector('#chart-impressions').__chartist__ = chart;
    }
    if (data.impressionsTypeLabels && data.impressionsTypeSeries) {
        const chart = new Chartist.Line('#chart-type', {
            labels: data.impressionsTypeLabels,
            series: [data.impressionsTypeSeries]
        }, lineOptions);
        document.querySelector('#chart-type').__chartist__ = chart;
    }
    if (data.clicksMonths && data.clicksSeries) {
        const chart = new Chartist.Line('#chart-clicks', {
            labels: data.clicksMonths,
            series: [data.clicksSeries]
        }, lineOptions);
        document.querySelector('#chart-clicks').__chartist__ = chart;
    }
    if (data.clicksTypeLabels && data.clicksTypeSeries) {
        const chart = new Chartist.Line('#chart-clicks-type', {
            labels: data.clicksTypeLabels,
            series: [data.clicksTypeSeries]
        }, lineOptions);
        document.querySelector('#chart-clicks-type').__chartist__ = chart;
    }
    if (data.reactionsMonths && data.reactionsSeries) {
        const chart = new Chartist.Line('#chart-reactions', {
            labels: data.reactionsMonths,
            series: [data.reactionsSeries]
        }, lineOptions);
        document.querySelector('#chart-reactions').__chartist__ = chart;
    }
    if (data.commentsMonths && data.commentsSeries) {
        const chart = new Chartist.Line('#chart-comments', {
            labels: data.commentsMonths,
            series: [data.commentsSeries]
        }, lineOptions);
        document.querySelector('#chart-comments').__chartist__ = chart;
    }

    // Enable tooltips for all charts (call AFTER rendering)
    attachChartistTooltips();
}



// --- FETCH IMPRESSIONS & OTHER METRICS DATA ---
function fetchImpressionsData(callback) {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2kiIWReRCRxBpqVt_erAkPUDwSSItcd9vO63hSjRstfSrye-voOaMkSUGAHOJtmEdlBKLWgzTxzgg/pub?gid=754567803&single=true&output=csv";
    const selectedYear = getSelectedYear();
    const selectedMonth = getSelectedMonth();

    fetchSheetData(csvUrl).then(rows => {
        if (!rows || rows.length < 2) return;
        const header = rows[0];
        const idxYear = header.findIndex(h => h.trim().toLowerCase() === "year");
        const idxMonth = header.findIndex(h => h.trim().toLowerCase() === "month");
        const idxType = header.findIndex(h => h.trim().toLowerCase() === "type");
        const idxImpressions = header.findIndex(h => h.trim().toLowerCase().includes("views"));
        const idxClicks = header.findIndex(h => h.trim().toLowerCase().includes("profile visits"));
        const idxReactions = header.findIndex(h => h.trim().toLowerCase().includes("accounts enagaged"));
        const idxComments = header.findIndex(h => h.trim().toLowerCase().includes("engagement"));

        function normalizeMonth(m) {
            return (m || "").toLowerCase().replace(/[\s\.,']/g, "").replace(/24|25/g, "");
        }

        // --- UPDATED FILTERING LOGIC ---
        let filteredRows = rows.slice(1).filter(row => {
            if (selectedYear === "all") return true;
            return row[idxYear] && row[idxYear].trim() === selectedYear;
        });
        if (selectedMonth !== "all") {
            filteredRows = filteredRows.filter(row =>
                normalizeMonth(row[idxMonth]) === normalizeMonth(selectedMonth)
            );
        }

        // --- Prepare chart data (same as before) ---
        const monthMap = {};
        const clicksMonthMap = {};
        const reactionsMonthMap = {};
        const commentsMonthMap = {};
        filteredRows.forEach(row => {
            const month = row[idxMonth];
            monthMap[month] = (monthMap[month] || 0) + (Number(row[idxImpressions]) || 0);
            clicksMonthMap[month] = (clicksMonthMap[month] || 0) + (Number(row[idxClicks]) || 0);
            reactionsMonthMap[month] = (reactionsMonthMap[month] || 0) + (Number(row[idxReactions]) || 0);
            commentsMonthMap[month] = (commentsMonthMap[month] || 0) + (Number(row[idxComments]) || 0);
        });
        const impressionsMonths = Object.keys(monthMap);
        const impressionsSeries = Object.values(monthMap);
        const clicksMonths = Object.keys(clicksMonthMap);
        const clicksSeries = Object.values(clicksMonthMap);
        const reactionsMonths = Object.keys(reactionsMonthMap);
        const reactionsSeries = Object.values(reactionsMonthMap);
        const commentsMonths = Object.keys(commentsMonthMap);
        const commentsSeries = Object.values(commentsMonthMap);

        // Impressions by Type
        const typeMap = {};
        const clicksTypeMap = {};
        filteredRows.forEach(row => {
            const type = row[idxType] || "Unknown";
            typeMap[type] = (typeMap[type] || 0) + (Number(row[idxImpressions]) || 0);
            clicksTypeMap[type] = (clicksTypeMap[type] || 0) + (Number(row[idxClicks]) || 0);
        });
        const impressionsTypeLabels = Object.keys(typeMap);
        const impressionsTypeSeries = Object.values(typeMap);
        const clicksTypeLabels = Object.keys(clicksTypeMap);
        const clicksTypeSeries = Object.values(clicksTypeMap);

        // Totals
        const totalImpressions = impressionsSeries.reduce((a, b) => a + b, 0);
        const totalClicks = clicksSeries.reduce((a, b) => a + b, 0);
        const totalReactions = reactionsSeries.reduce((a, b) => a + b, 0);
        const totalComments = commentsSeries.reduce((a, b) => a + b, 0);

        callback({
            totalImpressions: totalImpressions.toLocaleString(),
            impressionsMonths,
            impressionsSeries,
            impressionsTypeLabels,
            impressionsTypeSeries,
            totalClicks: totalClicks.toLocaleString(),
            clicksMonths,
            clicksSeries,
            clicksTypeLabels,
            clicksTypeSeries,
            totalReactions: totalReactions.toLocaleString(),
            reactionsMonths,
            reactionsSeries,
            totalComments: totalComments.toLocaleString(),
            commentsMonths,
            commentsSeries
        });
    });
}

let cachedSheetData = null;
let cachedSheetUrl = null;
let cachedSheetPromise = null;

function fetchSheetData(sheetUrl) {
    if (cachedSheetUrl === sheetUrl && cachedSheetData) {
        // Already fetched and cached
        return Promise.resolve(cachedSheetData);
    }
    if (cachedSheetUrl === sheetUrl && cachedSheetPromise) {
        // Already fetching, return the same promise
        return cachedSheetPromise;
    }
    // Fetch and cache
    cachedSheetUrl = sheetUrl;
    cachedSheetPromise = new Promise((resolve, reject) => {
        Papa.parse(sheetUrl, {
            download: true,
            complete: function(results) {
                cachedSheetData = results.data;
                resolve(cachedSheetData);
            },
            error: reject
        });
    });
    return cachedSheetPromise;
}

// --- FILTER HELPERS ---
function getSelectedYear() {
    const select = document.getElementById('year-filter');
    return select ? select.value : '2024';
}
function getSelectedMonth() {
    const select = document.getElementById('month-filter');
    return select ? select.value : 'all';
}

// --- POPULATE MONTH FILTER DYNAMICALLY ---
function populateMonthFilter() {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2kiIWReRCRxBpqVt_erAkPUDwSSItcd9vO63hSjRstfSrye-voOaMkSUGAHOJtmEdlBKLWgzTxzgg/pub?gid=1541324920&single=true&output=csv";
    const selectedYear = getSelectedYear();
    Papa.parse(csvUrl, {
        download: true,
        complete: function(results) {
            const rows = results.data;
            if (!rows || rows.length < 2) return;
            const header = rows[0];
            const idxMonth = header.findIndex(h => h.trim().toLowerCase() === "month");
            const idxYear = header.findIndex(h => h.trim().toLowerCase() === "year");
            if (idxMonth === -1 || idxYear === -1) return;

            // Get unique months for the selected year
            const monthsSet = new Set();
            for (let i = 1; i < rows.length; i++) {
                if (selectedYear === "all" || (rows[i][idxYear] && rows[i][idxYear].trim() === selectedYear)) {
                    monthsSet.add(rows[i][idxMonth]);
                }
            }
            const monthFilter = document.getElementById('month-filter');
            if (monthFilter) {
                // Clear and repopulate
                monthFilter.innerHTML = '<option value="all">All</option>';
                Array.from(monthsSet)
                    .filter(m => m && m.trim())
                    .forEach(month => {
                        monthFilter.innerHTML += `<option value="${month}">${month}</option>`;
                    });
            }
        }
    });
}

// --- UPDATE FILTER LISTENERS ---
function attachFilterListeners() {
    const yearFilter = document.getElementById('year-filter');
    const monthFilter = document.getElementById('month-filter');
    if (yearFilter) yearFilter.onchange = function() {
        populateMonthFilter();
        setTimeout(() => {
            if (monthFilter) {
                monthFilter.value = "all";
            }
            fetchSummaryData();
            fetchImpressionsData(renderImpressionsCards);
        }, 100);
    };
    if (monthFilter) monthFilter.onchange = function() {
        fetchSummaryData();
        fetchImpressionsData(renderImpressionsCards);
    };
}

// --- INIT DASHBOARD ---
function initInstagramDashboard() {
    populateMonthFilter();
    fetchSummaryData();
    fetchImpressionsData(renderImpressionsCards);
    attachFilterListeners();
}


// --- CHARTIST TOOLTIP ENHANCEMENTS ---
function attachChartistTooltips() {
    document.querySelectorAll('.ct-chart').forEach(chartEl => {
        let tooltip = chartEl.querySelector('.ct-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'ct-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.opacity = 0;
            chartEl.appendChild(tooltip);
        }

        // Position tooltip on mousemove over chart area
        chartEl.addEventListener('mousemove', function(e) {
            const rect = chartEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            tooltip.style.left = (x + 10) + 'px';
            tooltip.style.top = (y + 120) + 'px';
        });

        // Attach tooltip events to each point after chart is rendered
        const chart = chartEl.__chartist__;
        if (chart) {
            chart.on('draw', function(data) {
                if (data.type === 'point') {
                    data.element._node.addEventListener('mouseenter', function(e) {
                        tooltip.innerHTML = `<strong>${data.value.y}</strong>`;
                        tooltip.style.opacity = 1;
                        tooltip.style.left = (e.offsetX + 10) + 'px';
                        tooltip.style.top = (e.offsetY - 20) + 'px';
                    });
                    data.element._node.addEventListener('mouseleave', function() {
                        tooltip.style.opacity = 0;
                    });
                    data.element._node.addEventListener('mousemove', function(e) {
                        tooltip.style.left = (e.offsetX + 10) + 'px';
                        tooltip.style.top = (e.offsetY - 20) + 'px';
                    });
                }
            });
        }
    });
}
})();