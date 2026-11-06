import * as THREE from 'three';

/* Luzes globais da cena (segue o contrato de entidade, ver models/cubo.js).
 * Devolve as luzes em `luzes`, para o main.js ligar cada uma a uma tecla.
 * Intensidades ajustadas so aqui: material nao compensa luz com emissive (ver README)
 *
 * Tipos de luz do jogo:
 *   AmbientLight      ambiente: brilho geral, sem direcao            (aqui)
 *   DirectionalLight  sol/lua: so direcao, fonte infinitamente longe (aqui)
 *   SpotLight         farol do aviao: cone de luz                    (models/aviao.js)
 *   PointLight        luzes de navegacao: ponto que ilumina em volta (models/aviao.js) */

/* Valores de dia e de noite. O modo noite faz a transicao de um para o outro. */
const DIA = {
	ambiente:	{ cor: new THREE.Color(0xffffff), intensidade: 1.5 },
	sol:		{ cor: new THREE.Color(0xffffff), intensidade: 3.0 },
	ceu:		new THREE.Color(0xffffff),	/* multiplica a textura do ceu: branco = sem alteracao */
	neblina:	new THREE.Color(0xbfe3ff)	/* mesma cor do horizonte do ceu */
};

const NOITE = {
	ambiente:	{ cor: new THREE.Color(0x8aa0e0), intensidade: 1.0 },	/* azulada e fraca */
	sol:		{ cor: new THREE.Color(0xa0b4ff), intensidade: 0.8 },	/* vira luar */
	ceu:		new THREE.Color(0x1a2342),
	neblina:	new THREE.Color(0x0b1230)
};

const DURACAO_TRANSICAO = 1.5;	/* segundos para ir do dia a noite (e voltar) */

/* Liga/desliga uma luz (qualquer THREE.Light, inclusive as presas aos modelos).
 * Desligar zera a intensidade em vez de esconder a luz: o numero de luzes na cena
 * nao muda, entao o Three.js nao recompila os shaders a cada toque. */
export function alternar(luz) {
	if (luz.intensity > 0) {
		luz.userData.intensidade = luz.intensity;	/* guarda para religar */
		luz.intensity = 0;
	} else {
		luz.intensity = luz.userData.intensidade;
	}
}

/* Muda a intensidade sem ligar uma luz que esta desligada:
 * se ela esta apagada, so troca o valor guardado para quando for religada. */
function definirIntensidade(luz, valor) {
	if (luz.intensity > 0) luz.intensity = valor;
	else luz.userData.intensidade = valor;
}

export function createLuzes() {
	const grupo = new THREE.Group();

	/* Luz ambiente: brilho geral, sem direcao */
	const ambiente = new THREE.AmbientLight(DIA.ambiente.cor, DIA.ambiente.intensidade);

	/* Luz direcional (sol): fonte infinitamente distante, so direcao e cor */
	const sol = new THREE.DirectionalLight(DIA.sol.cor, DIA.sol.intensidade);
	sol.position.set(5, 10, 7);	/* Direcao = desta posicao ate a origem */

	grupo.add(ambiente, sol);

	/* Modo noite: 0 = dia, 1 = noite. `alvo` eh para onde `progresso` caminha. */
	let progresso = 0;
	let alvo = 0;
	let materialCeu = null;	/* guardados em alternarNoite(), vindos do main.js */
	let neblina = null;

	function aplicar(p) {
		ambiente.color.lerpColors(DIA.ambiente.cor, NOITE.ambiente.cor, p);
		definirIntensidade(ambiente, THREE.MathUtils.lerp(DIA.ambiente.intensidade, NOITE.ambiente.intensidade, p));
		sol.color.lerpColors(DIA.sol.cor, NOITE.sol.cor, p);
		definirIntensidade(sol, THREE.MathUtils.lerp(DIA.sol.intensidade, NOITE.sol.intensidade, p));
		if (materialCeu) materialCeu.color.lerpColors(DIA.ceu, NOITE.ceu, p);
		if (neblina) neblina.color.lerpColors(DIA.neblina, NOITE.neblina, p);
	}

	return {
		object: grupo,
		luzes: { ambiente, sol },

		/* Alterna dia/noite (tecla N, ligada no main.js).
		 * ceu: material do ceu; fog: scene.fog. Os dois mudam de cor junto com as luzes. */
		alternarNoite({ ceu, fog }) {
			materialCeu = ceu;
			neblina = fog;
			alvo = alvo === 0 ? 1 : 0;
		},

		get noite() { return alvo === 1; },

		update(dt) {
			if (progresso === alvo) return;
			const passo = dt / DURACAO_TRANSICAO;
			progresso = alvo > progresso
				? Math.min(alvo, progresso + passo)
				: Math.max(alvo, progresso - passo);
			aplicar(progresso);
		}
	}
}
