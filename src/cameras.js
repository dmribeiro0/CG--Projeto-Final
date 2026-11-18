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
 *   terceira: atras e acima do aviao; acompanha o avanco inteiro e parte do movimento lateral
 *   primeira: no cockpit, presa a ancora do aviao (herda o balanco e a inclinacao)
 *   livre: orbita em volta do aviao com o mouse e anda junto com ele (desenvolvimento e prints) */

/* 3a pessoa: posicao da camera e ponto para onde ela olha, ambos relativos ao aviao */
const OFFSET_TERCEIRA = new THREE.Vector3(0, 3, 12);
const ALVO_TERCEIRA = new THREE.Vector3(0, 0, -20);

/* Fracao do deslocamento em X e Y do aviao que a 3a pessoa acompanha. Com 1, o aviao ficaria
 * sempre no centro da tela e o movimento lateral nao apareceria; com 0, sairia da tela nos limites
 * do corredor (jogo/controle.js). Com 0,7, no limite ele fica a ~6 m do centro */
const SEGUIR_LADO = 0.7;

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
	/* Vetores reutilizados no update(), para nao criar objetos a cada frame */
	const base = new THREE.Vector3();
	const alvo = new THREE.Vector3();

	/* Sem position: fica no ponto da ancora, olhando para -Z (a frente do aviao) */
	const primeira = criarPerspectiva();
	primeira.name = '1ª pessoa';
	aviao.ancoras.cockpit.add(primeira);

	/* Comeca de lado e no alto, para nao repetir o enquadramento da 3a pessoa */
	const livre = criarPerspectiva();
	livre.name = 'Livre';
	livre.position.set(-14, 9, 16);

	/* Orbita em volta do aviao: o alvo da orbita comeca na posicao dele e anda junto (update) */
	const controls = new OrbitControls(livre, renderer.domElement);
	controls.target.copy(aviao.object.position);
	controls.enabled = false;	/* so liga com a camera livre ativa; senao o mouse a move sem aparecer na tela */
	const anterior = aviao.object.position.clone();	/* posicao do aviao no frame anterior */
	const deslocamento = new THREE.Vector3();

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
			const posicao = aviao.object.position;

			/* 3a pessoa: Z inteiro, X e Y em parte. Olha reto para a frente, nao para o aviao:
			 * assim ele se desloca na tela quando o jogador o move */
			base.set(posicao.x * SEGUIR_LADO, posicao.y * SEGUIR_LADO, posicao.z);
			terceira.position.copy(base).add(OFFSET_TERCEIRA);
			terceira.lookAt(alvo.copy(base).add(ALVO_TERCEIRA));

			/* Livre: camera e alvo da orbita andam o mesmo que o aviao andou, entao o enquadramento
			 * escolhido com o mouse se mantem. Atualizada mesmo inativa, para estar perto ao trocar */
			deslocamento.subVectors(posicao, anterior);
			livre.position.add(deslocamento);
			controls.target.add(deslocamento);
			anterior.copy(posicao);
		},

		redimensionar(aspect) {
			for (const camera of cameras) {
				camera.aspect = aspect;
				camera.updateProjectionMatrix();	/* Recalcula a matriz de projecao com o novo aspect */
			}
		}
	};
}
