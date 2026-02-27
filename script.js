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
