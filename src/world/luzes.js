import * as THREE from 'three';

/* Luzes base da cena (segue o contrato de entidade, ver models/cubo.js) */

export function createLuzes() {
	const grupo = new THREE.Group();

	/* Luz ambiente: brilho geral, sem direcao */
	const ambiente = new THREE.AmbientLight(0xffffff, 0.5);

	/* Luz direcional (sol): fonte infinitamente distante, so direcao e cor */
	const sol = new THREE.DirectionalLight(0xffffff, 1.5);
	sol.position.set(5, 10, 7);	/* Direcao = desta posicao ate a origem */

	grupo.add(ambiente, sol);

	return {
		object: grupo,
		update(dt) {}	/* Luzes estaticas por enquanto */
	}
}
