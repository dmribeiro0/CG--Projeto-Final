import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* Cameras do jogo: criacao, troca e ajuste ao tamanho da janela.
 *
 * Interface usada pelo main.js:
 *   ativa: camera usada no renderer.render()
 *   trocar(): passa para a proxima camera (tecla C, ligada no main.js)
 *   update(dt): chamada a cada frame, depois do update das entidades
 *   redimensionar(aspect): chamada quando a janela muda de tamanho
 *
 * TODO (cameras): 3a pessoa seguindo o aviao, 1a pessoa na ancora do cockpit,
 * camera livre com OrbitControls; FOV (teclas + e -). Por enquanto so a camera livre da entrega 2. */

export function createCameras({ renderer, aviao }) {
	/* Camera perspectiva; nasce na origem olhando para -Z */
	const livre =
		new THREE.PerspectiveCamera (
			75,										/* FOV - angulo do campo de visao */
			window.innerWidth / window.innerHeight,	/* Aspect ratio */
			0.1,									/* Plano de recorte mais proximo */
			1000 									/* Plano de recorte mais distante */
		);
	livre.position.set(0, 3, 12);	/* atras e um pouco acima do aviao, que esta na origem */

	/* Camera orbital com o mouse (desenvolvimento e prints) */
	const controls = new OrbitControls(livre, renderer.domElement);

	const cameras = [livre];
	let indice = 0;

	return {
		get ativa() { return cameras[indice]; },

		trocar() { indice = (indice + 1) % cameras.length; },

		update(dt) {},

		redimensionar(aspect) {
			for (const camera of cameras) {
				camera.aspect = aspect;
				camera.updateProjectionMatrix();	/* Recalcula o frustum com o novo aspect */
			}
		}
	};
}
