/* Estado da partida: pontos, vidas, distancia, vitoria/derrota e reinicio.
 * Nao conhece as regras: quem acerta, bate ou chega ao fim chama as funcoes.
 *
 * Interface:
 *   createPartida({ meta }): meta = metros ate a vitoria
 *   ganharPontos(n), perderVida(), vencer(): so valem enquanto a partida esta em jogo
 *   atualizarDistancia(metros): placar da distancia percorrida (so durante a partida)
 *   reiniciar(): volta ao inicio (tecla Enter, ligada no main.js)
 *   aoReiniciar(funcao): registra o que um modulo faz ao reiniciar (ex.: voltar o aviao ao inicio)
 *   pontos, vidas, distancia, estado: leitura */

const VIDAS_INICIAIS = 3;

function criar(pai, classe, texto = '') {
	const elemento = document.createElement('div');
	elemento.className = classe;
	elemento.textContent = texto;
	pai.appendChild(elemento);
	return elemento;
}

export function createPartida({ meta }) {
	let pontos = 0;
	let vidas = VIDAS_INICIAIS;
	let distancia = 0;	/* metros percorridos, inteiro */
	let estado = 'jogando';	/* 'jogando' | 'vitoria' | 'derrota' */
	const funcoesReinicio = [];

	/* Placar: canto superior direito, sempre visivel (fora do HUD, que a tecla H esconde) */
	const placar = criar(document.body, 'placar');

	/* Tela de fim: por cima do jogo, escondida durante a partida */
	const tela = criar(document.body, 'fim');
	const titulo = criar(tela, 'fim-titulo');
	const resultado = criar(tela, 'fim-pontos');
	const percurso = criar(tela, 'fim-pontos');
	criar(tela, 'fim-dica', 'Enter para jogar de novo');

	function mostrar() {
		placar.textContent = `Pontos ${pontos}   Vidas ${'♥'.repeat(Math.max(vidas, 0))}\nDistância ${distancia} / ${meta} m`;
		tela.hidden = estado === 'jogando';
		titulo.textContent = estado === 'vitoria' ? 'Vitória!' : 'Fim de jogo';
		resultado.textContent = `${pontos} pontos`;
		percurso.textContent = estado === 'vitoria'
			? `Percurso completo: ${meta} m`
			: `Você chegou a ${distancia} m de ${meta} m`;
	}

	function terminar(fim) {
		estado = fim;
		mostrar();
	}

	mostrar();

	return {
		get pontos() { return pontos; },
		get vidas() { return vidas; },
		get distancia() { return distancia; },
		get estado() { return estado; },

		ganharPontos(n) {
			if (estado !== 'jogando') return;
			pontos += n;
			mostrar();
		},

		/* Recebe os metros percorridos; so conta durante a partida e nunca passa da meta */
		atualizarDistancia(metros) {
			if (estado !== 'jogando') return;
			const metrosInteiros = Math.min(Math.floor(metros), meta);
			if (metrosInteiros === distancia) return;	/* so redesenha se o numero mudou */
			distancia = metrosInteiros;
			mostrar();
		},

		/* Tira uma vida; sem vidas, a partida termina em derrota */
		perderVida() {
			if (estado !== 'jogando') return;	/* depois do fim, bater nao conta */
			vidas -= 1;
			if (vidas <= 0) terminar('derrota');
			else mostrar();
		},

		vencer() {
			if (estado === 'jogando') terminar('vitoria');
		},

		reiniciar() {
			pontos = 0;
			vidas = VIDAS_INICIAIS;
			distancia = 0;
			estado = 'jogando';
			for (const funcao of funcoesReinicio) funcao();
			mostrar();
		},

		aoReiniciar(funcao) { funcoesReinicio.push(funcao); }
	};
}