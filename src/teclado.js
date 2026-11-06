/* Mapa central de teclas: toda tecla do jogo fica registrada aqui.
 * Evita duas partes do codigo usarem a mesma tecla e serve de legenda para o HUD.
 *
 * Usa evento.code (tecla fisica), nao evento.key: funciona com Caps Lock e em qualquer layout.
 * Codigos: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
 *
 * As acoes sao ligadas as funcoes no main.js, no bloco "Controles":
 *   aoPressionar('ajudantes', () => ajudantes.alternar());
 *
 * Para criar uma tecla nova: adicionar uma linha em TECLAS (conferir se o code ja nao esta em uso). */

export const TECLAS = {
	/* Cameras */
	trocarCamera:	{ code: 'KeyC',		rotulo: 'C',	descricao: 'Trocar câmera' },
	aumentarFov:	{ code: 'Equal',	rotulo: '+',	descricao: 'Aumentar FOV' },
	diminuirFov:	{ code: 'Minus',	rotulo: '-',	descricao: 'Diminuir FOV' },
	resetarFov:		{ code: 'Digit0',	rotulo: '0',	descricao: 'FOV padrão' },

	/* Luzes (liga/desliga individual) */
	luzAmbiente:	{ code: 'Digit1',	rotulo: '1',	descricao: 'Luz ambiente' },
	luzSol:			{ code: 'Digit2',	rotulo: '2',	descricao: 'Sol' },
	luzFarol:		{ code: 'Digit3',	rotulo: '3',	descricao: 'Farol do avião' },
	luzNavegacao:	{ code: 'Digit4',	rotulo: '4',	descricao: 'Luzes de navegação' },
	modoNoite:		{ code: 'KeyN',		rotulo: 'N',	descricao: 'Modo noite' },

	/* Desenvolvimento e interface */
	ajudantes:		{ code: 'KeyG',		rotulo: 'G',	descricao: 'Grid e eixos' },
	hud:			{ code: 'KeyH',		rotulo: 'H',	descricao: 'Mostrar/esconder HUD' }
};

/* Map: codigo da tecla -> nome da acao (ex.: 'Digit2' -> 'luzSol').
 * TECLAS vai de acao para codigo; o evento do teclado traz o codigo,
 * entao este Map faz o caminho inverso */
const mapaCodigoAcao = new Map();

/* Monta o Map uma vez, quando o arquivo eh carregado.
 * Se dois itens de TECLAS usam o mesmo codigo, para tudo com erro:
 * o conflito aparece no console assim que a pagina abre */
for (const [acao, tecla] of Object.entries(TECLAS)) {
	if (mapaCodigoAcao.has(tecla.code))
		throw new Error(`teclado.js: ${tecla.code} usado por '${mapaCodigoAcao.get(tecla.code)}' e '${acao}'`);
	mapaCodigoAcao.set(tecla.code, acao);
}

/* Map: nome da acao -> lista de funcoes a chamar (ex.: 'luzSol' -> [() => alternar(sol)]).
 * Lista porque mais de uma parte do codigo pode reagir a mesma tecla */
const mapaAcaoFuncoes = new Map();

/* Guarda a funcao para ser chamada quando a tecla da acao for pressionada.
 * Nao executa nada agora: so registra (a funcao eh um callback) */
export function aoPressionar(acao, funcao) {
	if (!(acao in TECLAS))
		throw new Error(`teclado.js: acao '${acao}' nao existe em TECLAS`);
	if (!mapaAcaoFuncoes.has(acao)) mapaAcaoFuncoes.set(acao, []);	/* primeira funcao da acao: cria a lista */
	mapaAcaoFuncoes.get(acao).push(funcao);
}

/* Teclas que ja tem funcao ligada, na ordem de TECLAS (legenda do HUD).
 * Chamar depois de ligar as teclas: acao sem funcao nao faz nada e nao deve aparecer */
export function teclasAtivas() {
	return Object.keys(TECLAS)
		.filter((acao) => mapaAcaoFuncoes.has(acao))
		.map((acao) => TECLAS[acao]);
}

/* Unico ouvinte de teclado do jogo: a cada tecla pressionada,
 * descobre a acao pelo codigo e chama as funcoes registradas para ela */
window.addEventListener('keydown', (evento) => {
	if (evento.repeat) return;	/* Segurar a tecla nao repete o liga/desliga */

	const acao = mapaCodigoAcao.get(evento.code);
	if (!acao) return;	/* tecla sem acao no jogo: ignora */

	for (const funcao of mapaAcaoFuncoes.get(acao) ?? []) funcao(evento);	/* ?? []: acao sem funcao registrada */
});
