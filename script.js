// Exemple de ce qu'on pourrait intégrer
new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Capital', 'Intérêts + Frais'],
        datasets: [{
            data: [montantAchat, totalInterets],
            backgroundColor: ['#3498db', '#e74c3c']
        }]
    }
});

let chartS;

// 1. AU CHARGEMENT : On récupère les données de l'URL ou du LocalStorage
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('cap')) {
        // Priorité à l'URL si on partage un lien
        document.getElementById('s-cap').value = params.get('cap');
        document.getElementById('s-rate').value = params.get('rate');
        document.getElementById('s-dur').value = params.get('dur');
    } else {
        // Sinon, on checke si on a une sauvegarde locale
        const saved = JSON.parse(localStorage.getItem('lastSimulation'));
        if (saved) {
            document.getElementById('s-cap').value = saved.cap;
            document.getElementById('s-rate').value = saved.rate;
            document.getElementById('s-dur').value = saved.dur;
        }
    }
    calcSimple();
    compare();
    calcCap();
};

function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    event.currentTarget.classList.add('active');
}

function calcSimple() {
    const P = parseFloat(document.getElementById('s-cap').value) || 0;
    const r_annual = parseFloat(document.getElementById('s-rate').value) || 0;
    const r = (r_annual / 100) / 12;
    const n = parseInt(document.getElementById('s-dur').value) || 0;
    const inf = (parseFloat(document.getElementById('s-inf').value) / 100) / 12;

    if (n <= 0) return;

    const m = r === 0 ? P/n : (P * r) / (1 - Math.pow(1 + r, -n));
    const total = m * n;
    const realValueLast = m / Math.pow(1 + inf, n);
    
    document.getElementById('s-res-m').innerText = m.toFixed(2) + " €";
    document.getElementById('s-res-total').innerText = "Coût total : " + total.toFixed(2) + " € (" + (total - P).toFixed(2) + "€ d'intérêts)";
    document.getElementById('inflation-msg').innerText = `💡 Grâce à l'inflation, votre dernière mensualité de ${m.toFixed(2)}€ ne pèsera que l'équivalent de ${realValueLast.toFixed(2)}€ d'aujourd'hui.`;

    updateChart(P, total - P);

    // SAUVEGARDE LOCALE AUTOMATIQUE
    localStorage.setItem('lastSimulation', JSON.stringify({cap: P, rate: r_annual, dur: n}));
}

// 2. FONCTION DE PARTAGE
function shareLink() {
    const cap = document.getElementById('s-cap').value;
    const rate = document.getElementById('s-rate').value;
    const dur = document.getElementById('s-dur').value;
    
    const url = new URL(window.location.href);
    url.searchParams.set('cap', cap);
    url.searchParams.set('rate', rate);
    url.searchParams.set('dur', dur);

    navigator.clipboard.writeText(url.toString());
    alert("Lien de partage copié dans le presse-papier ! 🔗");
}

// ... garde les fonctions compare(), calcCap() et updateChart() du code précédent ...
