import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
/* Importar aqui cada entidade */
import { createCubo } from './models/cubo.js';
import { createLuzes } from './world/luzes.js';

const scene = new THREE.Scene();

/* Camera perspectiva; nasce na origem olhando para -Z */
const camera = 
	new THREE.PerspectiveCamera (
		75,										/* FOV - angulo do campo de visao */
		window.innerWidth / window.innerHeight,	/* Aspect ratio */
		0.1,									/* Plano de recorte mais proximo */
		1000 									/* Plano de recorte mais distante */
	);
camera.position.z = 5;	/* Afasta a camera para ver o cubo, que esta na origem */

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
adicionar(createCubo());	/* apenas um exemplo de entidade, comente a linha para esconder */

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

