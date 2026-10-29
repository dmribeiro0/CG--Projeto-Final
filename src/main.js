import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
/* Importar aqui cada entidade */
import { createCubo } from './models/cubo.js';
import { createAviao } from './models/aviao.js';
import { createDrone } from './models/drone.js';
import { createDelta } from './models/delta.js';
import { createLuzes } from './world/luzes.js';
import { createAjudantes } from './world/ajudantes.js';
import { createCeu } from './world/ceu.js';
import { createChao } from './world/chao.js';
import { createPredios } from './world/predios.js';
import { createNuvens } from './world/nuvens.js';
import { createAneis } from './world/aneis.js';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xbfe3ff, 250, 900);	/* Neblina da cor do horizonte: esconde o fim do cenario */

/* Camera perspectiva; nasce na origem olhando para -Z */
const camera = 
	new THREE.PerspectiveCamera (
		75,										/* FOV - angulo do campo de visao */
		window.innerWidth / window.innerHeight,	/* Aspect ratio */
		0.1,									/* Plano de recorte mais proximo */
		1000 									/* Plano de recorte mais distante */
	);
camera.position.set(0, 3, 12);	/* 3a pessoa: atras e um pouco acima do aviao, que esta na origem */

const renderer = new THREE.WebGLRenderer();
/* Tamanho do canvas em pixels (viewport = janela inteira) */
renderer.setSize(
	window.innerWidth,
	window.innerHeight
);

/* Insere o canvas no html */
document.body.appendChild(renderer.domElement);

/* Adiciona na cena e registra para o update(dt) do loop */
function adicionar(entidade) {
	scene.add(entidade.object);
	entidades.push(entidade);
 	return entidade;
}

/* Entidades atualizadas a cada frame pelo loop */
const entidades = [];

/* Inserir aqui as entidades */
adicionar(createLuzes());
adicionar(createAjudantes());	/* grid de 1 m e eixos; tecla G esconde (para os prints finais) */
// adicionar(createCubo());	/* apenas um exemplo de entidade, descomente a linha para mostrar */

/* Cenario: o percurso se estende a frente do aviao, no sentido -Z */
adicionar(createCeu());
adicionar(createChao());		/* 30 m abaixo da altura de voo */
adicionar(createPredios());
adicionar(createNuvens());
adicionar(createAneis());		/* primeiro anel em z = -60 */

/* Personagens: aviao na origem; inimigos a frente, virados para o aviao (+Z) */
adicionar(createAviao());

const drone = adicionar(createDrone());
drone.object.position.set(-4, 2, -10);

const delta = adicionar(createDelta());
delta.object.position.set(5, 3, -18);
delta.object.rotation.y = Math.PI;	/* frente do modelo (-Z) passa a apontar para o aviao */

/* Camera orbital com o mouse (desenvolvimento e prints) */
const controls = new OrbitControls(camera, renderer.domElement);

/* Ao redimensionar a janela: atualiza aspect, projecao e canvas */
window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();	/* Recalcula o frustum com o novo aspect */
	renderer.setSize(window.innerWidth, window.innerHeight);
});

/* Loop: atualiza as entidades e desenha um frame */
let anterior = performance.now();

renderer.setAnimationLoop((tempo) => {
	/* dt em segundos; limitado a 0.1 para nao dar salto ao voltar de outra aba */
	const dt = Math.min((tempo - anterior) / 1000, 0.1);
	anterior = tempo;

	for (const entidade of entidades) {
		entidade.update(dt);
	}

	renderer.render(scene, camera);
});

