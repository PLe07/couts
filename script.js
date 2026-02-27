let chartS;

// 1. AU CHARGEMENT : Récupération des données (URL ou LocalStorage)
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('cap')) {
        document.getElementById('s-cap').value = params.get('cap');
        document.getElementById('s-rate').value = params.get('rate');
        document.getElementById('s-dur').value = params.get('dur');
    } else {
        const saved = JSON.parse(localStorage.getItem('financeProSave'));
        if (saved) {
            document.getElementById('s-cap').value = saved.cap;
            document.getElementById('s-rate').value = saved.rate;
            document.getElementById('s-dur').value = saved.dur;
            if(saved.inc) document.getElementById('s-income').value = saved.inc;
        }
    }
    run(); // Lance les calculs de l'onglet principal
    compare(); // Lance le comparateur
    calcCap(); // Lance le calcul de capacité
};

// GESTION DES ONGLETS
function switchView(viewId, el) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    if(el) el.classList.add('active');
}

// --- ONGLET 1 : SIMULATION PRINCIPALE ---
function run() {
    const P = parseFloat(document.getElementById('s-cap').value) || 0;
    const r_ann = parseFloat(document.getElementById('s-rate').value) / 100;
    const n_base = parseInt(document.getElementById('s-dur').value) || 0;
    const extra = parseFloat(document.getElementById('s-extra').value) || 0;
    const income = parseFloat(document.getElementById('s-income').value) || 0;
    const boost = parseFloat(document.getElementById('s-boost').value) || 0;
    const inf_ann = (parseFloat(document.getElementById('s-inf').value) / 100) / 12;

    if (n_base <= 0) return;

    const r = r_ann / 12;
    const m_base = r === 0 ? P / n_base : (P * r) / (1 - Math.pow(1 + r, -n_base));
    
    // Logique de remboursement anticipé (Boost)
    let m_boosted = m_base + boost;
    let n_new = n_base;
    if (boost > 0 && r > 0) {
        let val = 1 - (P * r) / m_boosted;
        if (val > 0) n_new = -Math.log(val) / Math.log(1 + r);
    }

    const m_total = m_boosted + extra;
    const total_int = (m_boosted * n_new) - P;
    const realValLast = m_total / Math.pow(1 + inf_ann, n_new);
    const ratio = income > 0 ? (m_total / income) * 100 : 0;

    // Mise à jour de l'interface
    document.getElementById('res-m-total').innerText = Math.round(m_total) + " €";
    document.getElementById('res-detail').innerText = `${Math.round(m_boosted)}€ (prêt) + ${extra}€ (frais)`;
    
    // Jauge d'endettement
    const gBar = document.getElementById('gauge-bar');
    document.getElementById('gauge-label').innerText = `Taux d'endettement : ${ratio.toFixed(1)}%`;
    gBar.style.width = Math.min(ratio, 100) + "%";
    
    // Checklist de Vigilance
    updateVigilance(P, r_ann * 100, n_new, ratio, total_int, extra * n_new);

    // Graphique et Sauvegarde
    updateChart(P, total_int, extra * n_new);
    localStorage.setItem('financeProSave', JSON.stringify({
        cap: P, 
        rate: r_ann * 100, 
        dur: n_base, 
        inc: income
    }));
}

function updateVigilance(P, r_ann_pct, n, ratio, int, totalFees) {
    const list = document.getElementById('vigilance-list');
    if(!list) return;
    list.innerHTML = "";
    let conseils = [];

    if (r_ann_pct > 5) conseils.push("❌ <b>Taux élevé :</b> Ton taux dépasse 5%. C'est cher.");
    else conseils.push("✅ <b>Taux correct :</b> Ton taux est raisonnable.");

    if (n > 60) conseils.push("⚠️ <b>Durée longue :</b> Tu vas payer beaucoup d'intérêts sur la durée.");
    if (ratio > 33) conseils.push("🚨 <b>Danger budget :</b> Tu dépasses les 33% d'endettement !");
    if (totalFees > int) conseils.push("🧐 <b>Frais élevés :</b> L'assurance/entretien coûte plus cher que le crédit.");

    conseils.forEach(txt => {
        let li = document.createElement('li');
        li.innerHTML = txt;
        li.style.marginBottom = "5px";
        list.appendChild(li);
    });
}

function updateChart(cap, int, fees) {
    const ctx = document.getElementById('chartSimple').getContext('2d');
    if (chartS) chartS.destroy();
    chartS = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Capital', 'Intérêts', 'Frais'],
            datasets: [{ 
                data: [cap, int, fees], 
                backgroundColor: ['#2563eb', '#ef4444', '#f59e0b'] 
            }]
        },
        options: { 
            maintainAspectRatio: false, 
            plugins: { legend: { position: 'bottom' } } 
        }
    });
}

// --- ONGLET 2 : COMPARATEUR ---
function compare() {
    const calc = (p, rate, dur) => {
        const r = (rate / 100) / 12;
        if (dur <= 0) return { m: 0, total: 0 };
        const m = r === 0 ? p / dur : (p * r) / (1 - Math.pow(1 + r, -dur));
        return { m, total: m * dur };
    };

    const r1 = calc(
        parseFloat(document.getElementById('c1-cap').value) || 0,
        parseFloat(document.getElementById('c1-rate').value) || 0,
        parseInt(document.getElementById('c1-dur').value) || 0
    );
    const r2 = calc(
        parseFloat(document.getElementById('c2-cap').value) || 0,
        parseFloat(document.getElementById('c2-rate').value) || 0,
        parseInt(document.getElementById('c2-dur').value) || 0
    );

    document.getElementById('c1-res').innerText = `Total : ${r1.total.toFixed(2)}€ (${r1.m.toFixed(2)}€/m)`;
    document.getElementById('c2-res').innerText = `Total : ${r2.total.toFixed(2)}€ (${r2.m.toFixed(2)}€/m)`;

    const diff = Math.abs(r1.total - r2.total).toFixed(2);
    const winner = r1.total < r2.total ? "Option A" : "Option B";
    document.getElementById('compare-winner').innerText = `${winner} est plus avantageuse (Économie : ${diff}€)`;
}

// --- ONGLET 3 : CAPACITÉ D'ACHAT ---
function calcCap() {
    const m = parseFloat(document.getElementById('cap-m').value) || 0;
    const r = (parseFloat(document.getElementById('cap-r').value) / 100) / 12;
    const n = (parseFloat(document.getElementById('cap-y').value) || 0) * 12;

    if (n <= 0) return;
    const p = r === 0 ? m * n : m * (1 - Math.pow(1 + r, -n)) / r;
    document.getElementById('cap-res').innerText = Math.floor(p).toLocaleString() + " €";
}

// PARTAGE
function shareLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('cap', document.getElementById('s-cap').value);
    url.searchParams.set('rate', document.getElementById('s-rate').value);
    url.searchParams.set('dur', document.getElementById('s-dur').value);
    navigator.clipboard.writeText(url.toString());
    alert("Lien de partage copié ! 🔗");
}
