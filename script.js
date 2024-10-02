// Função para adicionar uma mensagem ao painel de logs
function addLogMessage(message) {
    const logPanel = document.getElementById('log-panel');
    const logMessage = document.createElement('div');
    logMessage.className = 'log-message';
    logMessage.textContent = message;
    logPanel.appendChild(logMessage);
}

// URLs da API que retornam os resultados da Lotofácil
const apiUrlLatest = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest';
const apiUrlBase = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil/';

// Função que faz a requisição à API para pegar o concurso por número
async function getConcurso(concurso) {
    addLogMessage(`Buscando concurso número: ${concurso}`);
    const response = await fetch(apiUrlBase + concurso);
    const data = await response.json();
    return data; // Retorna os dados do concurso
}

// Função que busca os últimos concursos e retorna os números como um dataset
async function buscarUltimosConcursos(qtdConcursos) {
    addLogMessage(`Buscando os últimos ${qtdConcursos} concursos...`);
    const response = await fetch(apiUrlLatest);
    const data = await response.json();
    const ultimoConcurso = data.concurso;

    let concursosAnalisados = [];

    for (let i = 0; i < qtdConcursos; i++) {
        let concursoAtual = await getConcurso(ultimoConcurso - i);
        addLogMessage(`Concurso ${ultimoConcurso - i}: ${concursoAtual.dezenas}`);
        concursosAnalisados.push(concursoAtual.dezenas.map(Number)); // Adiciona o concurso ao array
    }

    addLogMessage(`Dados coletados: ${JSON.stringify(concursosAnalisados)}`);
    return concursosAnalisados;
}

// Função para treinar o modelo de Machine Learning
async function treinarModelo(dadosConcursos) {
    addLogMessage(`Iniciando o treinamento do modelo com ${dadosConcursos.length} concursos...`);

    // Preparar os dados: X (números dos concursos anteriores), Y (números sorteados)
    const xs = dadosConcursos.map(c => c.slice(0, -1));  // Concursos anteriores
    const ys = dadosConcursos.map(c => {
        const ultimo = c.slice(-1)[0];
        const y = new Array(25).fill(0); // Criar um vetor de 25 elementos (1 a 25)
        y[ultimo - 1] = 1; // Marcar o número sorteado
        return y; // Retornar vetor com 1 no índice do número sorteado
    });

    addLogMessage(`Dados de entrada (X): ${JSON.stringify(xs)}`);
    addLogMessage(`Dados de saída (Y): ${JSON.stringify(ys)}`);

    // Converter os dados em tensores
    const tensorX = tf.tensor2d(xs);
    const tensorY = tf.tensor2d(ys);

    // Definir o modelo de rede neural
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [xs[0].length] }));
    model.add(tf.layers.dense({ units: 25, activation: 'softmax' })); // 25 números possíveis

    // Compilar o modelo
    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    // Treinar o modelo
    addLogMessage(`Iniciando o treinamento...`);
    await model.fit(tensorX, tensorY, {
        epochs: 100,  // Número de iterações de treinamento
        batchSize: 32,
        validationSplit: 0.2  // 80% treino, 20% validação
    });
    addLogMessage(`Modelo treinado com sucesso!`);

    return model;
}

// Função para prever os números
async function preverNumeros(modelo, numerosAnteriores) {
    addLogMessage(`Fazendo previsão para os números: ${numerosAnteriores}`);
    const tensorEntrada = tf.tensor2d([numerosAnteriores]);
    const previsoes = modelo.predict(tensorEntrada);
    
    // Transformar as previsões em um array
    const arrayPrevisoes = previsoes.arraySync()[0];
    addLogMessage(`Previsões: ${JSON.stringify(arrayPrevisoes)}`);

    return arrayPrevisoes
        .map((probabilidade, numero) => ({ numero: numero + 1, probabilidade }))
        .sort((a, b) => b.probabilidade - a.probabilidade)  // Ordenar por maior probabilidade
        .slice(0, 15);  // Selecionar os 15 números mais prováveis
}

// Função para gerar os jogos com base nos números previstos
function gerarJogos(numerosFrequentes, qtdJogos = 1) {
    addLogMessage(`Gerando ${qtdJogos} jogos...`);
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
        addLogMessage(`Jogo ${i + 1}: ${jogo.join(', ')}`);
    }

    return jogos;
}

// Função para exibir os resultados na tela
function exibirJogos(jogos) {
    const jogosContainer = document.getElementById('jogos-gerados');
    jogosContainer.innerHTML = '';  // Limpa a lista anterior

    if (jogos.length === 0) {
        addLogMessage('Nenhum jogo gerado.');
        return;
    }

    jogos.forEach((jogo, index) => {
        let listItem = document.createElement('li');
        listItem.innerHTML = `Jogo ${index + 1}: ${jogo.join(', ')}`;
        jogosContainer.appendChild(listItem);
    });
    addLogMessage(`Jogos exibidos com sucesso!`);
}

// Função principal que coordena a análise e a geração dos jogos usando TensorFlow.js
async function analisarEGerarJogosComTensorFlow(qtdJogos, qtdConcursos) {
    // Atualiza a mensagem durante o processamento
    document.getElementById('info-concurso').innerText = `Analisando os últimos ${qtdConcursos} concursos...`;

    // Faz a análise dos últimos concursos
    const dadosConcursos = await buscarUltimosConcursos(qtdConcursos);
    
    // Treina o modelo com os dados históricos
    const modelo = await treinarModelo(dadosConcursos);

    // Usa o modelo para prever os números mais prováveis
    const previsao = await preverNumeros(modelo, dadosConcursos[dadosConcursos.length - 1]);

    // Gera os jogos com base na previsão
    const jogos = gerarJogos(previsao.map(p => p.numero), qtdJogos);

    // Atualiza a mensagem após o processamento
    document.getElementById('info-concurso').innerText = `Análise concluída! Gerando ${qtdJogos} jogos com base nas previsões.`;

    // Exibe os jogos gerados
    exibirJogos(jogos);
}

// Função para obter a quantidade de jogos desejada pelo usuário e iniciar o processo
function gerarJogosUsuario() {
    const qtdJogos = parseInt(document.getElementById('qtd-jogos').value);
    const qtdConcursos = parseInt(document.getElementById('qtd-concursos').value);
    if (qtdJogos > 0 && qtdConcursos > 0) {
        analisarEGerarJogosComTensorFlow(qtdJogos, qtdConcursos);
    } else {
        alert('Por favor, insira uma quantidade válida de jogos e concursos.');
    }
}
