/* Tela inicial: titulo, objetivo, pontuacao, controles e botao de jogar.
 * Elementos HTML por cima do canvas; o jogo fica parado atras dela (estado 'menu' em partida.js).
 * O visual fica em styles.css (classes .inicio-*).
 *
 * Interface usada pelo main.js:
 *   mostrar() / esconder(): chamadas quando o estado da partida muda
 *
 * aoIniciar: funcao chamada ao clicar em JOGAR (a tecla Enter eh tratada em teclado.js)
 * pontos: { anel, drone, delta } para a legenda de pontuacao */

const CONTROLES = [
	['W A S D', 'Mover o avião'],
	['Espaço', 'Atirar (segure)'],
	['C', 'Trocar câmera'],
	['P', 'Pausar'],
	['Enter', 'Reiniciar'],
	['M', 'Menu']
];

function criar(pai, classe, texto = '', tag = 'div') {
	const elemento = document.createElement(tag);
	elemento.className = classe;
	elemento.textContent = texto;
	pai.appendChild(elemento);
	return elemento;
}

export function createTelaInicial({ aoIniciar, meta, pontos }) {
	const tela = criar(document.body, 'inicio');
	const caixa = criar(tela, 'inicio-caixa');

	criar(caixa, 'inicio-titulo', 'SKY SHOOTER');
	criar(caixa, 'inicio-subtitulo', 'Shooter 3D sobre trilho');
	criar(caixa, 'inicio-objetivo',
		`Sobreviva a ${meta} m de avenida. Abata os inimigos, atravesse os anéis e desvie dos prédios: ` +
		'bater em um prédio, em um inimigo ou levar um tiro custa uma vida (você tem 3).');

	const colunas = criar(caixa, 'inicio-colunas');

	const controles = criar(colunas, 'inicio-bloco');
	criar(controles, 'inicio-bloco-titulo', 'Controles');
	for (const [tecla, descricao] of CONTROLES) {
		const linha = criar(controles, 'hud-item');
		criar(linha, 'hud-tecla', tecla);
		criar(linha, 'hud-descricao', descricao);
	}

	const placar = criar(colunas, 'inicio-bloco');
	criar(placar, 'inicio-bloco-titulo', 'Pontuação');
	for (const [nome, valor] of [['Anel', pontos.anel], ['Drone', pontos.drone], ['Caça delta', pontos.delta]]) {
		const linha = criar(placar, 'hud-item');
		criar(linha, 'hud-tecla', `+${valor}`);
		criar(linha, 'hud-descricao', nome);
	}

	const botao = criar(caixa, 'inicio-botao', 'JOGAR', 'button');
	botao.addEventListener('click', () => aoIniciar());
	criar(caixa, 'fim-dica', 'ou aperte Enter');

	return {
		mostrar() { tela.hidden = false; },
		esconder() {
			tela.hidden = true;
			botao.blur();	/* botao com foco responderia ao Espaco (tiro) como um clique */
		}
	};
}
