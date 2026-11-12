import { teclasAtivas } from './teclado.js';

/* HUD: elementos HTML por cima do canvas, com camera, FOV, luzes e a legenda das teclas.
 * Nao eh entidade: nao coloca nada na cena. O visual fica em styles.css.
 *
 * Interface usada pelo main.js:
 *   update(): chamada a cada frame, depois das cameras
 *   alternar(): mostra/esconde o HUD (tecla H, ligada no main.js)
 *
 * Criar depois do bloco "Controles": a legenda lista so as teclas que ja tem funcao ligada. */

/* Nome de cada luz no painel; luz fora da lista aparece com o nome da chave */
const NOMES_LUZES = {
	ambiente: 'Ambiente',
	sol: 'Sol',
	farol: 'Farol',
	navEsq: 'Navegação esq.',
	navDir: 'Navegação dir.'
};

function criar(pai, classe, texto = '') {
	const elemento = document.createElement('div');
	elemento.className = classe;
	elemento.textContent = texto;
	pai.appendChild(elemento);
	return elemento;
}

/* Cria uma linha "nome ... valor" e devolve o elemento do valor */
function criarLinha(pai, nome) {
	const linha = criar(pai, 'hud-linha');
	criar(linha, 'hud-nome', nome);
	return criar(linha, 'hud-valor');
}

/* So escreve se mudou: o update() roda a cada frame */
function escrever(elemento, texto) {
	if (elemento.textContent !== texto) elemento.textContent = texto;
}

/* luzes: { nome: THREE.Light }
 * relevo: opcional, { ligado } de relevo.js */
export function createHud({ cameras, fov, luzes, relevo }) {
	const hud = criar(document.body, 'hud');

	/* Canto superior esquerdo: estado atual */
	const painel = criar(hud, 'hud-painel');
	const valorCamera = criarLinha(painel, 'Câmera');
	const valorFov = criarLinha(painel, 'FOV');
	criar(painel, 'hud-separador');
	const linhasLuzes = Object.entries(luzes).map(([chave, luz]) => ({
		luz,
		valor: criarLinha(painel, NOMES_LUZES[chave] ?? chave)
	}));
	const valorRelevo = relevo ? criarLinha(painel, 'Relevo') : null;

	/* Rodape: legenda das teclas */
	const legenda = criar(hud, 'hud-legenda');
	for (const { rotulo, descricao } of teclasAtivas()) {
		const item = criar(legenda, 'hud-item');
		criar(item, 'hud-tecla', rotulo);
		criar(item, 'hud-descricao', descricao);
	}

	return {
		update() {
			escrever(valorCamera, cameras.ativa.name);
			escrever(valorFov, `${fov.fov}°`);
			for (const { luz, valor } of linhasLuzes) {
				const ligada = luz.intensity > 0;
				escrever(valor, ligada ? 'ON' : 'OFF');
				valor.classList.toggle('hud-desligada', !ligada);
			}
			if (valorRelevo) {
				escrever(valorRelevo, relevo.ligado ? 'ON' : 'OFF');
				valorRelevo.classList.toggle('hud-desligada', !relevo.ligado);
			}
		},

		alternar() { hud.hidden = !hud.hidden; }
	};
}
