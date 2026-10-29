import * as THREE from 'three';
import { CHAO_Y } from './chao.js';

/* Ajudantes visuais para conferir escala e orientacao (segue o contrato de entidade, ver models/cubo.js)
 *   grid: no chao, plano XZ, cada quadrado = 1 m
 *   eixos: na origem (centro do aviao), X vermelho, Y verde, Z azul (a frente do jogo eh -Z, oposta ao azul)
 * Comecam escondidos; tecla G liga/desliga */

export function createAjudantes() {
	const grupo = new THREE.Group();
	grupo.visible = false;

	const grid = new THREE.GridHelper(100, 100);	/* 100 m x 100 m, divisoes de 1 m */
	grid.position.y = CHAO_Y + 0.01;				/* Um pouco acima do chao, para nao piscar junto com ele */

	const eixos = new THREE.AxesHelper(5);			/* Cada eixo com 5 m */

	grupo.add(grid, eixos);

	window.addEventListener('keydown', (evento) => {
		if (evento.key === 'g') grupo.visible = !grupo.visible;
	});

	return {
		object: grupo,
		update(dt) {}
	}
}
