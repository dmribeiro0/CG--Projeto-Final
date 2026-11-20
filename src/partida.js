/* Estado da partida: pontos, vidas, progresso, vitoria/derrota, pausa e reinicio.
 * Nao conhece as regras: quem acerta, bate ou chega ao fim chama as funcoes.
 *
 * Estados: 'menu' (tela inicial) | 'jogando' | 'pausado' | 'vitoria' | 'derrota'
 *
 * Interface:
 *   ganharPontos(n), perderVida(), vencer(): so valem enquanto a partida esta em jogo
 *   atualizarDistancia(metros): placar da distancia percorrida (so durante a partida; nunca passa da meta)
 *   reiniciar(): comeca uma partida nova (tecla Enter, ligada no main.js; no menu, inicia o jogo)
 *   alternarPausa(): pausa / continua (tecla P)
 *   irParaMenu(): volta a tela inicial (tecla M)
 *   aoReiniciar(funcao): registra o que um modulo faz ao zerar (ex.: voltar o aviao ao inicio)
 *   aoMudarEstado(funcao): chamada com o novo estado a cada mudanca (ex.: mostrar/esconder o menu)
 *   pontos, vidas, distancia, estado: leitura */

const VIDAS_INICIAIS = 3;
const CHAVE_RECORDE = 'skyshooter-recorde';

function criar(pai, classe, texto = '') {
	const elemento = document.createElement('div');
	elemento.className = classe;
	elemento.textContent = texto;
	pai.appendChild(elemento);
	return elemento;
}

/* localStorage pode estar bloqueado (modo privado): nesse caso o recorde so vale na sessao */
function lerRecorde() {
	try { return Number(localStorage.getItem(CHAVE_RECORDE)) || 0; } catch { return 0; }
}
function gravarRecorde(valor) {
	try { localStorage.setItem(CHAVE_RECORDE, String(valor)); } catch { /* sem armazenamento */ }
}

export function createPartida({ meta }) {
	let pontos = 0;
	let vidas = VIDAS_INICIAIS;
	let distancia = 0;	/* metros percorridos, inteiro */
	let recorde = lerRecorde();
	let novoRecorde = false;
	let estado = 'menu';
	const funcoesReinicio = [];
	const ouvintesEstado = [];

	/* Placar: canto superior direito, sempre visivel durante o jogo (fora do HUD, que a tecla H esconde) */
	const placar = criar(document.body, 'placar');

	/* Flash vermelho nas bordas da tela quando o aviao leva dano */
	const flashDano = criar(document.body, 'dano');

	/* Tela de pausa e de fim: por cima do jogo, escondida durante a partida */
	const tela = criar(document.body, 'fim');
	const titulo = criar(tela, 'fim-titulo');
	const resultado = criar(tela, 'fim-pontos');
	const percurso = criar(tela, 'fim-pontos');
	const dica = criar(tela, 'fim-dica');

	function mostrar() {
		placar.hidden = estado === 'menu';
		placar.textContent =
			`Pontos ${pontos}   Vidas ${'♥'.repeat(Math.max(vidas, 0))}\n` +
			`Distância ${distancia} / ${meta} m   Recorde ${recorde}`;

		const fim = estado === 'vitoria' || estado === 'derrota';
		tela.hidden = !(fim || estado === 'pausado');
		titulo.textContent = estado === 'vitoria' ? 'Vitória!' : estado === 'derrota' ? 'Fim de jogo' : 'Pausado';
		resultado.textContent = `${pontos} pontos` + (fim ? `\n${novoRecorde ? 'Novo recorde!' : `Recorde: ${recorde}`}` : '');
		percurso.hidden = !fim;
		percurso.textContent = estado === 'vitoria'
			? `Percurso completo: ${meta} m`
			: `Você chegou a ${distancia} m de ${meta} m`;
		dica.textContent = fim ? 'Enter: jogar de novo   M: menu' : 'P: continuar   M: menu';
	}

	function mudar(novo) {
		estado = novo;
		mostrar();
		for (const funcao of ouvintesEstado) funcao(estado);
	}

	function zerar() {
		pontos = 0;
		vidas = VIDAS_INICIAIS;
		distancia = 0;
		novoRecorde = false;
		for (const funcao of funcoesReinicio) funcao();
	}

	function terminar(fim) {
		if (pontos > recorde) {
			recorde = pontos;
			novoRecorde = true;
			gravarRecorde(recorde);
		}
		mudar(fim);
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

		/* Tira uma vida; sem vidas, a partida termina em derrota */
		perderVida() {
			if (estado !== 'jogando') return;	/* depois do fim, bater nao conta */
			vidas -= 1;
			flashDano.classList.remove('ativo');
			void flashDano.offsetWidth;		/* forca o navegador a recomecar a animacao CSS */
			flashDano.classList.add('ativo');
			if (vidas <= 0) terminar('derrota');
			else mostrar();
		},

		vencer() {
			if (estado !== 'jogando') return;
			distancia = meta;
			terminar('vitoria');
		},

		/* Recebe os metros percorridos; so conta durante a partida e nunca passa da meta */
		atualizarDistancia(metros) {
			if (estado !== 'jogando') return;
			const metrosInteiros = Math.min(Math.floor(metros), meta);
			if (metrosInteiros === distancia) return;	/* so redesenha se o numero mudou */
			distancia = metrosInteiros;
			mostrar();
		},

		reiniciar() {
			zerar();
			mudar('jogando');
		},

		alternarPausa() {
			if (estado === 'jogando') mudar('pausado');
			else if (estado === 'pausado') mudar('jogando');
		},

		irParaMenu() {
			if (estado === 'menu') return;
			zerar();
			mudar('menu');
		},

		aoReiniciar(funcao) { funcoesReinicio.push(funcao); },
		aoMudarEstado(funcao) { ouvintesEstado.push(funcao); }
	};
}
