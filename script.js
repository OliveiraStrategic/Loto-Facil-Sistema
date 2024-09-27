// URLs da API que retornam os resultados da Lotofácil
const apiUrlLatest = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest';
const apiUrlBase = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil/';

// Função que faz a requisição à API para pegar o concurso por número
async function getConcurso(concurso) {
    const response = await fetch(apiUrlBase + concurso);
    return await response.json();
}

// Função que busca os últimos 15 concursos e retorna os números mais frequentes
async function buscarUltimos15Concursos() {
    const response = await fetch(apiUrlLatest);
    const data = await response.json();
    const ultimoConcurso = data.concurso;

    let frequencias = new Array(25).fill(0);  // Array para contar a frequência de cada número (de 1 a 25)
    for (let i = 0; i < 15; i++) {
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

// Função principal que coordena a análise e a geração dos jogos
async function analisarEGerarJogos(qtdJogos) {
    // Atualiza a mensagem durante o processamento
    document.getElementById('info-concurso').innerText = 'Analisando os últimos 15 concursos...';
    
    // Faz a análise dos últimos 15 concursos
    const frequencias = await buscarUltimos15Concursos();
    const numerosFrequentes = numerosMaisFrequentes(frequencias);
    const jogos = gerarJogos(numerosFrequentes, qtdJogos);

    // Atualiza a mensagem após o processamento
    document.getElementById('info-concurso').innerText = `Análise concluída! Gerando ${qtdJogos} jogos com base nas probabilidades.`;

    // Exibe os jogos gerados
    exibirJogos(jogos);
}

// Função para obter a quantidade de jogos desejada pelo usuário e iniciar o processo
function gerarJogosUsuario() {
    const qtdJogos = parseInt(document.getElementById('qtd-jogos').value);
    if (qtdJogos > 0) {
        analisarEGerarJogos(qtdJogos);
    } else {
        alert('Por favor, insira uma quantidade válida de jogos.');
    }
}
