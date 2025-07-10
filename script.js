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

    // --- 1. Cálculo da Matriz de Custo ---
    const m = seq1.length;
    const n = seq2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    const traceback = Array(m + 1).fill(null).map(() => Array(n + 1).fill(null));

    for (let i = 1; i <= m; i++) {
        dp[i][0] = i * gapCost;
        traceback[i][0] = 'top';
    }
    for (let j = 1; j <= n; j++) {
        dp[0][j] = j * gapCost;
        traceback[0][j] = 'left';
    }

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

    // Armazenar os resultados para a função de visualização
    alignmentData = { dp, traceback, seq1, seq2, m, n };

    // --- 2. Exibir a Matriz Completa ---
    document.getElementById('results-title').style.display = 'block';
    document.getElementById('score-output').innerHTML = `<h3>Custo Mínimo Final: ${dp[m][n]}</h3>`;
    document.getElementById('alignment-output').innerHTML = ''; // Limpar alinhamento anterior

    let tableHTML = '<h3>Matriz de Custo:</h3><table><thead><tr><th></th><th>#</th>';
    for (let char of seq2) tableHTML += `<th>${char}</th>`;
    tableHTML += '</tr></thead><tbody>';

    for (let i = 0; i <= m; i++) {
        tableHTML += `<tr><th>${(i > 0) ? seq1[i - 1] : '#'}</th>`;
        for (let j = 0; j <= n; j++) {
            // Adicionar um ID único para cada célula para fácil manipulação
            tableHTML += `<td id="cell-${i}-${j}">${dp[i][j]}</td>`;
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';
    document.getElementById('matrix-container').innerHTML = tableHTML;

    // Habilitar o botão de visualização
    document.getElementById('visualize-btn').disabled = false;
}

async function visualizeTraceback() {
    const { dp, traceback, seq1, seq2, m, n } = alignmentData;
    if (!dp) return;

    // Desabilitar botões durante a animação
    document.getElementById('calculate-btn').disabled = true;
    document.getElementById('visualize-btn').disabled = true;

    // Limpar destaques anteriores da tabela
    for (let i = 0; i <= m; i++) {
        for (let j = 0; j <= n; j++) {
            document.getElementById(`cell-${i}-${j}`).classList.remove('traceback-path', 'traceback-current');
        }
    }

    let aligned1 = '';
    let aligned2 = '';
    let alignmentInfo = '';
    let i = m;
    let j = n;

    const alignmentResultDiv = document.querySelector('.alignment-result') || document.createElement('div');
    if (!document.querySelector('.alignment-result')) {
        alignmentResultDiv.className = 'alignment-result';
        document.getElementById('alignment-output').innerHTML = '<h3>Construindo Alinhamento:</h3>';
        document.getElementById('alignment-output').appendChild(alignmentResultDiv);
    }
    
    while (i > 0 || j > 0) {
        const currentCell = document.getElementById(`cell-${i}-${j}`);
        currentCell.classList.add('traceback-current');
        
        // Exibir o alinhamento sendo construído
        alignmentResultDiv.innerHTML = `<span>${aligned1}</span>\n` +
                                       `<span>${alignmentInfo}</span>\n` +
                                       `<span>${aligned2}</span>`;

        await sleep(500); // Pausa de 500ms para visualização

        const dir = traceback[i][j];
        let tempAligned1 = '', tempAligned2 = '', tempInfo = '';
        
        if (dir === 'diag') {
            tempAligned1 = seq1[i - 1];
            tempAligned2 = seq2[j - 1];
            tempInfo = (seq1[i - 1] === seq2[j - 1]) ? '<span class="match">|</span>' : '<span class="mismatch"> </span>';
            i--; j--;
        } else if (dir === 'top') {
            tempAligned1 = seq1[i - 1];
            tempAligned2 = '-';
            tempInfo = '<span class="gap"> </span>';
            i--;
        } else { // left
            tempAligned1 = '-';
            tempAligned2 = seq2[j - 1];
            tempInfo = '<span class="gap"> </span>';
            j--;
        }
        
        aligned1 = tempAligned1 + aligned1;
        aligned2 = tempAligned2 + aligned2;
        alignmentInfo = tempInfo + alignmentInfo;

        currentCell.classList.remove('traceback-current');
        currentCell.classList.add('traceback-path');
        
        // Adicionar seta indicando o caminho
        const arrow = dir === 'diag' ? '↖' : dir === 'top' ? '↑' : '←';
        const arrowClass = dir === 'diag' ? 'diag-arrow' : dir === 'top' ? 'top-arrow' : 'left-arrow';
        currentCell.innerHTML = `${dp[i+ (dir !== 'left')][j + (dir !== 'top')]}<span class="arrow ${arrowClass}">${arrow}</span>`;
    }
    
    // Marcar a célula de origem e exibir o alinhamento final
    document.getElementById('cell-0-0').classList.add('traceback-path');
    alignmentResultDiv.innerHTML = `<span>${aligned1}</span>\n` +
                                   `<span>${alignmentInfo}</span>\n` +
                                   `<span>${aligned2}</span>`;

    // Habilitar o botão de cálculo para um novo alinhamento
    document.getElementById('calculate-btn').disabled = false;
}