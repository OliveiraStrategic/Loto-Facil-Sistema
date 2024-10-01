// URLs da API que retornam os resultados da Lotofácil
const apiUrlLatest = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest';
const apiUrlBase = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil/';

// Função que faz a requisição à API para pegar o concurso por número
async function getConcurso(concurso) {
    const response = await fetch(apiUrlBase + concurso);
    return await response.json();
}

// Função que busca os últimos concursos e retorna os números mais frequentes
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

    numerosComFrequencia.sort((a, b) => b.frequencia - a.frequencia);  // Ordena por frequência
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

// Função para gerar gráficos detalhados
function gerarGraficos(frequencias, jogos) {
    const ctxFrequencias = document.getElementById('frequenciasChart').getContext('2d');
    const ctxJogosGerados = document.getElementById('jogosGeradosChart').getContext('2d');

    // Gráfico de frequências
    new Chart(ctxFrequencias, {
        type: 'bar',
        data: {
            labels: Array.from({length: 25}, (_, i) => i + 1),
            datasets: [{
                label: 'Frequência',
                data: frequencias,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    title: {
                        display: true,
                        text: 'Números'
                    }
                }
            }
        }
    });

    // Gráfico de jogos gerados
    const jogosFrequencias = Array(25).fill(0);  // Frequência de números nos jogos gerados
    jogos.forEach(jogo => {
        jogo.forEach(num => {
            jogosFrequencias[num - 1]++;  // Conta a frequência de cada número
        });
    });

    new Chart(ctxJogosGerados, {
        type: 'pie',
        data: {
            labels: Array.from({length: 25}, (_, i) => i + 1),
            datasets: [{
                label: 'Números nos Jogos Gerados',
                data: jogosFrequencias,
                backgroundColor: jogosFrequencias.map(() => `hsl(${Math.random() * 360}, 100%, 50%)`),
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Função para gerar gráfico de distribuição
function gerarGraficoDistribuicao(frequencias, qtdConcursos) {
    const ctxDistribuicao = document.getElementById('distribuicaoChart').getContext('2d');

    new Chart(ctxDistribuicao, {
        type: 'line',
        data: {
            labels: Array.from({length: 25}, (_, i) => i + 1),
            datasets: [{
                label: 'Frequência de Sorteios',
                data: frequencias.map(freq => freq / qtdConcursos), // Normaliza pela quantidade de concursos
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frequência Normalizada'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Números'
                    }
                }
            }
        }
    });
}

// Função principal que coordena a análise e a geração dos jogos
async function analisarEGerarJogos(qtdJogos, qtdConcursos) {
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

    // Gera os gráficos
    gerarGraficos(frequencias, jogos);
    gerarGraficoDistribuicao(frequencias, qtdConcursos);
}

// Função para obter a quantidade de jogos desejada pelo usuário e iniciar o processo
function gerarJogosUsuario() {
    const qtdJogos = parseInt(document.getElementById('qtd-jogos').value);
    const qtdConcursos = parseInt(document.getElementById('qtd-concursos').value);
    if (qtdJogos > 0 && qtdConcursos > 0) {
        analisarEGerarJogos(qtdJogos, qtdConcursos);
    } else {
        alert('Por favor, insira uma quantidade válida de jogos e concursos.');
    }
}
