// common.js

function setActive(btnId) {
    document.getElementById('linkedin-btn').classList.remove('active');
    document.getElementById('instagram-btn').classList.remove('active');
    document.getElementById(btnId).classList.add('active');
}

function loadDashboard(dashboard) {
    let url = '';
    let scriptUrl = '';
    if (dashboard === 'linkedin') {
        url = 'linkedin-dashboard.html';
        scriptUrl = 'assets/js/linkedin.js';
    } else if (dashboard === 'instagram') {
        url = 'instagram-dashboard.html';
        scriptUrl = 'assets/js/instagram.js';
    }

    fetch(url)
        .then(res => res.text())
        .then(html => {
            document.getElementById('main-content').innerHTML = html;
            setActive(dashboard + '-btn');

            // Remove the old script to prevent redeclaration errors
            const oldScript = document.getElementById('dashboard-script');
            if (oldScript) {
                oldScript.remove();
            }

            // Create and load the new script
            const script = document.createElement('script');
            script.id = 'dashboard-script'; // Assign an ID for easy removal
            script.src = scriptUrl;
            script.onload = () => {
                if (dashboard === 'linkedin' && typeof initLinkedInDashboard === 'function') {
                    initLinkedInDashboard();
                } else if (dashboard === 'instagram' && typeof initInstagramDashboard === 'function') {
                    initInstagramDashboard();
                }
            };
            document.body.appendChild(script);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    loadDashboard('linkedin');
    document.getElementById('linkedin-btn').onclick = function() {
        loadDashboard('linkedin');
    };
    document.getElementById('instagram-btn').onclick = function() {
        loadDashboard('instagram');
    };
});
