// Variável global para armazenar os dados do alinhamento entre as funções
let alignmentData = {};

// Função para criar um atraso (delay)
const sleep = ms => new Promise(res => setTimeout(res, ms));

function calculateMatrix() {
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
    
    // --- Lógica de cálculo da matriz  ---
    const m = seq1.length;
    const n = seq2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    const traceback = Array(m + 1).fill(null).map(() => Array(n + 1).fill(null));
    for (let i = 1; i <= m; i++) { dp[i][0] = i * gapCost; traceback[i][0] = 'top'; }
    for (let j = 1; j <= n; j++) { dp[0][j] = j * gapCost; traceback[0][j] = 'left'; }
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = (seq1[i - 1] === seq2[j - 1]) ? matchCost : mismatchCost;
            const diagCost = dp[i - 1][j - 1] + cost;
            const topCost = dp[i - 1][j] + gapCost;
            const leftCost = dp[i][j - 1] + gapCost;
            dp[i][j] = Math.min(diagCost, topCost, leftCost);
            if (dp[i][j] === diagCost) traceback[i][j] = 'diag';
            else if (dp[i][j] === topCost) traceback[i][j] = 'top';
            else traceback[i][j] = 'left';
        }
    }

    alignmentData = { dp, traceback, seq1, seq2, m, n };

    // --- Exibir os Resultados ---
    document.getElementById('results-title').style.display = 'block';
    
    // Limpar resultados anteriores para a nova ordem do layout
    document.getElementById('score-output').innerHTML = '';
    document.getElementById('alignment-output').innerHTML = ''; 

    const costDisplay = document.getElementById('cost-display');
    costDisplay.innerHTML = `
        <h4>Custos Definidos:</h4>
        <p>Mismatch: ${mismatchCost}</p>
        <p>Gap: ${gapCost}</p>
    `;

    // Exibir a Matriz de Custo
    let tableHTML = '<h3>Matriz de Custo:</h3><table><thead><tr><th></th><th>#</th>';
    for (let char of seq2) tableHTML += `<th>${char}</th>`;
    tableHTML += '</tr></thead><tbody>';
    for (let i = 0; i <= m; i++) {
        tableHTML += `<tr><th>${(i > 0) ? seq1[i - 1] : '#'}</th>`;
        for (let j = 0; j <= n; j++) {
            tableHTML += `<td id="cell-${i}-${j}">${dp[i][j]}</td>`;
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';
    document.getElementById('matrix-container').innerHTML = tableHTML;

    document.getElementById('visualize-btn').disabled = false;
}


async function visualizeTraceback() {
    const { dp, traceback, seq1, seq2, m, n } = alignmentData;
    if (!dp) return;

    const mismatchCost = parseInt(document.getElementById('mismatch').value);
    const gapCost = parseInt(document.getElementById('gap').value);

    document.getElementById('calculate-btn').disabled = true;
    document.getElementById('visualize-btn').disabled = true;

    for (let row = 0; row <= m; row++) {
        for (let col = 0; col <= n; col++) {
            const cell = document.getElementById(`cell-${row}-${col}`);
            if(cell) cell.classList.remove('traceback-path', 'traceback-current');
        }
    }

    let aligned1 = '', aligned2 = '', alignmentInfo = '';
    let i = m, j = n;

    let mismatchCount = 0, gapCount = 0;
    
    // --- Array para guardar a descrição dos eventos ---
    let eventLog = [];

    const alignmentResultDiv = document.createElement('div');
    alignmentResultDiv.className = 'alignment-result'; // Use a classe para estilização
    document.getElementById('alignment-output').innerHTML = '<h3>Construindo Alinhamento:</h3>';
    document.getElementById('alignment-output').appendChild(alignmentResultDiv);
    
    while (i > 0 || j > 0) {
        const currentCell = document.getElementById(`cell-${i}-${j}`);
        if(currentCell) currentCell.classList.add('traceback-current');
        
        alignmentResultDiv.innerHTML = `<span>${aligned1}</span><br><span>${alignmentInfo}</span><br><span>${aligned2}</span>`;
        await sleep(500);

        const dir = traceback[i][j];
        let tempAligned1 = '', tempAligned2 = '', tempInfo = '';
        
        if (dir === 'diag') {
            tempAligned1 = seq1[i - 1];
            tempAligned2 = seq2[j - 1];
            if (seq1[i - 1] === seq2[j - 1]) {
                tempInfo = '<span class="match">|</span>';
            } else {
                tempInfo = '<span class="mismatch"> </span>';
                mismatchCount++;
                // --- NOVO: Registra o evento de mismatch ---
                eventLog.push(`Mismatch: '${seq1[i - 1]}' vs '${seq2[j - 1]}'`);
            }
            i--; j--;
        } else if (dir === 'top') {
            tempAligned1 = seq1[i - 1];
            tempAligned2 = '-';
            tempInfo = '<span class="gap"> </span>';
            gapCount++;
            // --- NOVO: Registra o evento de gap ---
            eventLog.push(`Gap na sequência 2 (caractere '${seq1[i-1]}' alinhado com gap)`);
            i--;
        } else { // left
            tempAligned1 = '-';
            tempAligned2 = seq2[j - 1];
            tempInfo = '<span class="gap"> </span>';
            gapCount++;
            // --- Registra o evento de gap ---
            eventLog.push(`Gap na sequência 1 (caractere '${seq2[j-1]}' alinhado com gap)`);
            j--;
        }
        
        aligned1 = tempAligned1 + aligned1;
        aligned2 = tempAligned2 + aligned2;
        alignmentInfo = tempInfo + alignmentInfo;

        if(currentCell) {
            currentCell.classList.remove('traceback-current');
            currentCell.classList.add('traceback-path');
            const arrow = dir === 'diag' ? '↖' : dir === 'top' ? '↑' : '←';
            const arrowClass = dir === 'diag' ? 'diag-arrow' : dir === 'top' ? 'top-arrow' : 'left-arrow';
            const cellValue = dp[i + (dir !== 'left')][j + (dir !== 'top')];
            currentCell.innerHTML = `${cellValue}<span class="arrow ${arrowClass}">${arrow}</span>`;
        }
    }
    
    if(document.getElementById('cell-0-0')) {
        document.getElementById('cell-0-0').classList.add('traceback-path');
    }

    alignmentResultDiv.innerHTML = `<span>${aligned1}</span><br><span>${alignmentInfo}</span><br><span>${aligned2}</span>`;

    // --- Inverte o log para mostrar na ordem correta e cria o HTML ---
    eventLog.reverse();
    let eventsHTML = eventLog.map(event => `<li>${event}</li>`).join('');

    const scoreOutputDiv = document.getElementById('score-output');
    scoreOutputDiv.innerHTML = `
        <h3>Custo Mínimo Final: ${dp[m][n]}</h3>
        <h4>Detalhamento do Custo:</h4>
        <ul>
            <li>Mismatches: ${mismatchCount} × ${mismatchCost} = <strong>${mismatchCount * mismatchCost}</strong></li>
            <li>Gaps: ${gapCount} × ${gapCost} = <strong>${gapCount * gapCost}</strong></li>
        </ul>
        <h4>Eventos do Alinhamento:</h4>
        <ul>${eventsHTML}</ul>
    `;
    

    document.getElementById('calculate-btn').disabled = false;
}