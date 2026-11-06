import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* Cameras do jogo: criacao, troca e ajuste ao tamanho da janela.
 *
 * Interface usada pelo main.js:
 *   ativa: camera usada no renderer.render()
 *   todas: lista das cameras (o controle de FOV muda todas juntas)
 *   trocar(): passa para a proxima camera (tecla C, ligada no main.js)
 *   update(dt): chamada a cada frame, depois do update das entidades
 *   redimensionar(aspect): chamada quando a janela muda de tamanho
 *
 * Cameras, na ordem da troca:
 *   terceira: atras e acima do aviao, acompanha a posicao dele
 *   primeira: no cockpit, presa a ancora do aviao (herda o balanco)
 *   livre: orbita em volta do aviao com o mouse (desenvolvimento e prints) */

/* 3a pessoa: posicao da camera e ponto para onde ela olha, ambos relativos ao aviao */
const OFFSET_TERCEIRA = new THREE.Vector3(0, 3, 12);
const ALVO_TERCEIRA = new THREE.Vector3(0, 0, -20);

/* Cria uma camera perspectiva.
 * MATRIZ DE PROJECAO - definida aqui: o construtor guarda os parametros do frustum e chama
 * updateProjectionMatrix(), que calcula camera.projectionMatrix (Matrix4.makePerspective).
 * Recalculada quando FOV ou aspect mudam: redimensionar() abaixo e aplicar() em world/projecao.js.
 * Aplicada no renderer.render(), no loop do main.js. */
function criarPerspectiva() {
	return new THREE.PerspectiveCamera(
		75,										/* FOV - angulo do campo de visao */
		window.innerWidth / window.innerHeight,	/* Aspect ratio */
		0.1,									/* Plano de recorte mais proximo */
		1000									/* Plano de recorte mais distante */
	);
}

export function createCameras({ renderer, aviao }) {
	/* Posicionada a cada frame em update() */
	const terceira = criarPerspectiva();
	terceira.name = '3ª pessoa';	/* name: texto mostrado no HUD */
	const alvo = new THREE.Vector3();	/* reutilizado no update(), para nao criar um vetor por frame */

	/* Sem position: fica no ponto da ancora, olhando para -Z (a frente do aviao) */
	const primeira = criarPerspectiva();
	primeira.name = '1ª pessoa';
	aviao.ancoras.cockpit.add(primeira);

	/* Comeca de lado e no alto, para nao repetir o enquadramento da 3a pessoa */
	const livre = criarPerspectiva();
	livre.name = 'Livre';
	livre.position.set(-14, 9, 16);

	/* Orbita em volta da origem, onde esta o aviao */
	const controls = new OrbitControls(livre, renderer.domElement);
	controls.enabled = false;	/* so liga com a camera livre ativa; senao o mouse a move sem aparecer na tela */

	const cameras = [terceira, primeira, livre];
	let indice = 0;

	return {
		get ativa() { return cameras[indice]; },
		todas: cameras,

		trocar() {
			indice = (indice + 1) % cameras.length;
			controls.enabled = cameras[indice] === livre;
		},

		update(dt) {
			/* Offset fixo: o aviao ainda nao se desloca, so o grupo interno dele balanca */
			const posicao = aviao.object.position;
			terceira.position.copy(posicao).add(OFFSET_TERCEIRA);
			terceira.lookAt(alvo.copy(posicao).add(ALVO_TERCEIRA));
		},

		redimensionar(aspect) {
			for (const camera of cameras) {
				camera.aspect = aspect;
				camera.updateProjectionMatrix();	/* Recalcula a matriz de projecao com o novo aspect */
			}
		}
	};
}
