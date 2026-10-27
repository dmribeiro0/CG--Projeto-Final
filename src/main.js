import * as THREE from 'three';

/* Cria a cena */
const scene = new THREE.Scene();

/* Cria a camera na posicao (0, 0, 0) */
const camera = new 
	THREE.PerspectiveCamera (
		75,										/* FOV - angulo do campo de visao */
		window.innerWidth / window.innerHeight,	/* Aspect ratio */
		0.1,									/* Plano de recorte mais proximo */
		1000 									/* Plano de recorte mais distante */
	);
camera.position.z = 5;	/* move a camera */

/* Cria o renderizador */
const renderer = new THREE.WebGLRenderer();
renderer.setSize(
	window.innerWidth,	/* Acredito que sejam as medidas da viewport */
	window.innerHeight	/*********************************************/
);

/* Insere o canvas no html */
document.body.appendChild(renderer.domElement);