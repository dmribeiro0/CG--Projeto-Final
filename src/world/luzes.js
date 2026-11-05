import * as THREE from 'three';

/* Luzes globais da cena (segue o contrato de entidade, ver models/cubo.js).
 * Devolve as luzes em `luzes`, para o main.js ligar cada uma a uma tecla.
 * Intensidades ajustadas so aqui: material nao compensa luz com emissive (ver README) */

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

export function createLuzes() {
	const grupo = new THREE.Group();

	/* Luz ambiente: brilho geral, sem direcao */
	const ambiente = new THREE.AmbientLight(0xffffff, 1.5);

	/* Luz direcional (sol): fonte infinitamente distante, so direcao e cor */
	const sol = new THREE.DirectionalLight(0xffffff, 3.0);
	sol.position.set(5, 10, 7);	/* Direcao = desta posicao ate a origem */

	grupo.add(ambiente, sol);

	return {
		object: grupo,
		luzes: { ambiente, sol },
		update(dt) {}	/* Luzes estaticas por enquanto */
	}
}
