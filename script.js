function runAlignment() {
    // Obter entradas do usuário
    const seq1 = document.getElementById('seq1').value.toUpperCase();
    const seq2 = document.getElementById('seq2').value.toUpperCase();
    const matchCost = parseInt(document.getElementById('match').value);
    const mismatchCost = parseInt(document.getElementById('mismatch').value);
    const gapCost = parseInt(document.getElementById('gap').value);

    if (!seq1 || !seq2) {
        alert("Por favor, insira ambas as sequências.");
        return;
    }

    // --- 1. Inicialização da Matriz ---
    const m = seq1.length;
    const n = seq2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    const traceback = Array(m + 1).fill(null).map(() => Array(n + 1).fill(null));

    // Preencher a primeira linha e coluna com os custos de gap acumulados
    for (let i = 1; i <= m; i++) {
        dp[i][0] = i * gapCost;
        traceback[i][0] = 'top';
    }
    for (let j = 1; j <= n; j++) {
        dp[0][j] = j * gapCost;
        traceback[0][j] = 'left';
    }

    // --- 2. Preenchimento da Matriz (com Minimização de Custo) ---
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = (seq1[i - 1] === seq2[j - 1]) ? matchCost : mismatchCost;
            
            const diagCost = dp[i - 1][j - 1] + cost;
            const topCost = dp[i - 1][j] + gapCost;
            const leftCost = dp[i][j - 1] + gapCost;

            // Usar Math.min() para encontrar o menor custo
            dp[i][j] = Math.min(diagCost, topCost, leftCost);

            // Armazenar a direção do menor custo para o traceback
            if (dp[i][j] === diagCost) {
                traceback[i][j] = 'diag';
            } else if (dp[i][j] === topCost) {
                traceback[i][j] = 'top';
            } else { // leftCost
                traceback[i][j] = 'left';
            }
        }
    }

    // --- 3. Traceback (Funciona da mesma forma, seguindo o caminho gravado) ---
    let aligned1 = '';
    let aligned2 = '';
    let alignmentInfo = '';
    let i = m;
    let j = n;
    const path = new Set();

    while (i > 0 || j > 0) {
        path.add(`${i}-${j}`);
        const dir = traceback[i][j];
        if (dir === 'diag') {
            aligned1 = seq1[i - 1] + aligned1;
            aligned2 = seq2[j - 1] + aligned2;
            alignmentInfo = ((seq1[i - 1] === seq2[j - 1]) ? 
                '<span class="match">|</span>' : '<span class="mismatch"> </span>') + alignmentInfo;
            i--;
            j--;
        } else if (dir === 'top') {
            aligned1 = seq1[i - 1] + aligned1;
            aligned2 = '-' + aligned2;
            alignmentInfo = '<span class="gap"> </span>' + alignmentInfo;
            i--;
        } else { // left
            aligned1 = '-' + aligned1;
            aligned2 = seq2[j - 1] + aligned2;
            alignmentInfo = '<span class="gap"> </span>' + alignmentInfo;
            j--;
        }
    }
    path.add(`0-0`);

    // --- 4. Exibição dos Resultados ---
    document.getElementById('results-title').style.display = 'block';

    // Exibir custo final
    document.getElementById('score-output').innerHTML = `<h3>Custo Mínimo do Alinhamento: ${dp[m][n]}</h3>`;

    // Exibir alinhamento
    const alignmentHTML = `<div class="alignment-result">` +
                          `<span>${aligned1}</span>\n` +
                          `<span>${alignmentInfo}</span>\n` +
                          `<span>${aligned2}</span>` +
                          `</div>`;
    document.getElementById('alignment-output').innerHTML = `<h3>Alinhamento de Custo Mínimo:</h3>${alignmentHTML}`;
    
    // Exibir matriz
    let tableHTML = '<h3>Matriz de Custo (com Caminho Destacado):</h3><table><thead><tr><th></th><th>#</th>';
    for (let char of seq2) {
        tableHTML += `<th>${char}</th>`;
    }
    tableHTML += '</tr></thead><tbody>';

    for (i = 0; i <= m; i++) {
        tableHTML += `<tr><th>${(i > 0) ? seq1[i - 1] : '#'}</th>`;
        for (j = 0; j <= n; j++) {
            const isPath = path.has(`${i}-${j}`);
            let arrow = '';
            if(i > 0 || j > 0) {
                const dir = traceback[i][j];
                if (dir === 'diag') arrow = '<span class="arrow diag-arrow">↖</span>';
                else if (dir === 'top') arrow = '<span class="arrow top-arrow">↑</span>';
                else if (dir === 'left') arrow = '<span class="arrow left-arrow">←</span>';
            }
            tableHTML += `<td class="${isPath ? 'traceback-path' : ''}">${dp[i][j]}${isPath ? arrow : ''}</td>`;
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';
    document.getElementById('matrix-container').innerHTML = tableHTML;
}