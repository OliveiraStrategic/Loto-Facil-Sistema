// URLs da API que retornam os resultados da Lotofácil
const apiUrlLatest = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest';
const apiUrlBase = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil/';

// Função que faz a requisição à API para pegar o concurso por número
async function getConcurso(concurso) {
    const response = await fetch(apiUrlBase + concurso);
    return await response.json();
}

// Função que busca os últimos N concursos e retorna os números mais frequentes
async function buscarUltimosConcursos(qtdConcursos) {
    const response = await fetch(apiUrlLatest);
    const data = await response.json();
    const ultimoConcurso = data.concurso;

    let frequencias = new Array(25).fill(0);  // Array para contar a frequência de cada número (de 1 a 25)
    for (let i = 0; i < qtdConcursos; i++) {
        let concursoAtual = await getConcurso(ultimoConcurso - i);
        concursoAtual.dezenas.forEach(numero => {
            frequencias[parseInt(numero) - 1]++;
        });
    }

    return frequencias;
}

// Função que retorna os números com maior probabilidade
function numerosMaisFrequentes(frequencias, qtdNumeros = 15) {
    const numerosComFrequencia = frequencias.map((frequencia, indice) => ({
        numero: indice + 1,
        frequencia: frequencia
    }));

    // Ordena por frequência
    numerosComFrequencia.sort((a, b) => b.frequencia - a.frequencia);  
    return numerosComFrequencia.slice(0, qtdNumeros).map(item => item.numero);  // Pega os mais frequentes
}

// Função que gera os jogos baseados nas probabilidades
function gerarJogos(numerosFrequentes, qtdJogos = 1) {
    let jogos = [];

    for (let i = 0; i < qtdJogos; i++) {
        let jogo = [];
        while (jogo.length < 15) {
            let numeroAleatorio = numerosFrequentes[Math.floor(Math.random() * numerosFrequentes.length)];
            if (!jogo.includes(numeroAleatorio)) {
                jogo.push(numeroAleatorio);
            }
        }
        jogos.push(jogo);
    }

    return jogos;
}

// Função para exibir os resultados na tela
function exibirJogos(jogos) {
    const jogosContainer = document.getElementById('jogos-gerados');
    jogosContainer.innerHTML = '';  // Limpa a lista anterior

    jogos.forEach((jogo, index) => {
        let listItem = document.createElement('li');
        listItem.innerHTML = `Jogo ${index + 1}: ${jogo.join(', ')}`;
        jogosContainer.appendChild(listItem);
    });
}

// Função para criar o gráfico de frequências
function criarGraficoFrequencias(frequencias) {
    const ctx = document.getElementById('frequenciasChart').getContext('2d');
    const labels = Array.from({ length: 25 }, (_, i) => i + 1); // Números de 1 a 25
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequência dos Números',
                data: frequencias,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Função para criar o gráfico de jogos gerados
function criarGraficoJogosGerados(jogos) {
    const ctx = document.getElementById('jogosGeradosChart').getContext('2d');
    const labels = Array.from({ length: jogos.length }, (_, i) => `Jogo ${i + 1}`);
    const chartData = jogos.map(jogo => jogo.reduce((acc, numero) => acc + 1, 0)); // Contagem de números em cada jogo
    const chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição dos Jogos Gerados',
                data: chartData,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw}`;
                        }
                    }
                }
            }
        }
    });
}

// Função principal que coordena a análise e a geração dos jogos
async function analisarEGerarJogos() {
    const qtdJogos = parseInt(document.getElementById('qtd-jogos').value);
    const qtdConcursos = parseInt(document.getElementById('qtd-concursos').value);
    
    if (qtdConcursos < 1) {
        alert('Por favor, insira uma quantidade válida de concursos.');
        return;
    }

    // Atualiza a mensagem durante o processamento
    document.getElementById('info-concurso').innerText = `Analisando os últimos ${qtdConcursos} concursos...`;

    // Faz a análise dos últimos concursos
    const frequencias = await buscarUltimosConcursos(qtdConcursos);
    const numerosFrequentes = numerosMaisFrequentes(frequencias);
    const jogos = gerarJogos(numerosFrequentes, qtdJogos);

    // Atualiza a mensagem após o processamento
    document.getElementById('info-concurso').innerText = `Análise concluída! Gerando ${qtdJogos} jogos com base nas probabilidades.`;

    // Exibe os jogos gerados
    exibirJogos(jogos);

    // Cria os gráficos
    criarGraficoFrequencias(frequencias);
    criarGraficoJogosGerados(jogos);
}

// Função para obter a quantidade de jogos desejada pelo usuário e iniciar o processo
function gerarJogosUsuario() {
    const qtdJogos = parseInt(document.getElementById('qtd-jogos').value);
    if (qtdJogos > 0) {
        analisarEGerarJogos();
    } else {
        alert('Por favor, insira uma quantidade válida de jogos.');
    }
}
