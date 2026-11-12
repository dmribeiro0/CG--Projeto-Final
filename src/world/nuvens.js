import * as THREE from 'three';
import { mulberry32 } from '../aleatorio.js';
import { carregaTextura } from '../textura.js';

/* Nuvens do cenario - segue o contrato de entidade, ver models/cubo.js
 * Cada nuvem eh um Group com varias esferas achatadas ("puffs") sobrepostas. */

const QTD_NUVENS = 40;
const Z_INICIO = 40;		/* nuvens comecam um pouco atras do aviao */
const Z_FIM = -700;		/* e se estendem ate o fundo do percurso inicial */

/* Geometria e material compartilhados por todas as nuvens */
const geometriaPuff = new THREE.SphereGeometry(1, 16, 12);
/* Textura de nuvem (gerada pelo grupo: ruido fractal sem emenda, ver assets/texturas/nuvem*.png).
 * u e v do SphereGeometry vao de 0 a 1 em volta da esfera; repetir [2, 1] da 2 "voltas" de textura
 * na longitude, para os detalhes nao ficarem grandes demais numa esfera achatada */
const REP = { repetir: [2, 1] };
const materialNuvem = new THREE.MeshPhongMaterial({
	map: carregaTextura('nuvem.png', REP),
	normalMap: carregaTextura('nuvem_normal.png', { ...REP, cor: false }),	/* relevo: "couve-flor" */
	normalScale: new THREE.Vector2(0.6, 0.6),	/* relevo suave, nuvem nao eh pedra */
	color: 0xffffff,
	shininess: 5	/* nuvem eh opaca e fosca: brilho especular baixo */
});

function criarNuvem(rand) {
	const nuvem = new THREE.Group();
	const puffs = 4 + Math.floor(rand() * 4);	/* 4 a 7 esferas */

	for (let i = 0; i < puffs; i++) {
		const puff = new THREE.Mesh(geometriaPuff, materialNuvem);
		const raio = 3 + rand() * 4;
		puff.scale.set(raio * 1.3, raio * 0.8, raio);	/* achatada */
		/* Espalha as esferas em um bolo (x e z), para a nuvem nao virar uma fila */
		puff.position.set(
			(rand() - 0.5) * 14,
			(rand() - 0.5) * 2.5,
			(rand() - 0.5) * 8
		);
		/* Gira cada esfera em Y (sem gastar rand(): o layout das nuvens nao muda),
		 * para que esferas vizinhas mostrem partes diferentes da textura */
		puff.rotation.y = i * 2.4;
		nuvem.add(puff);
	}
	return nuvem;
}

export function createNuvens() {
	const rand = mulberry32(12345);	/* semente fixa: o cenario eh sempre o mesmo */
	const grupo = new THREE.Group();

	for (let i = 0; i < QTD_NUVENS; i++) {
		const nuvem = criarNuvem(rand);

		/* Lado e altura aleatorios; sorteia de novo se cair no corredor do aviao */
		let x, y;
		do {
			x = (rand() - 0.5) * 220;
			y = -25 + rand() * 70;
		} while (Math.abs(x) < 15 && Math.abs(y) < 12);

		nuvem.position.set(x, y, Z_INICIO + rand() * (Z_FIM - Z_INICIO));
		nuvem.rotation.y = rand() * Math.PI;
		grupo.add(nuvem);
	}

	return {
		object: grupo,
		update(dt) {}	/* Nuvens estaticas por enquanto */
	}
}