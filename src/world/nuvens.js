import * as THREE from 'three';

/* Nuvens do cenario - segue o contrato de entidade, ver models/cubo.js
 * Cada nuvem eh um Group com varias esferas achatadas ("puffs") sobrepostas. */

const QTD_NUVENS = 40;
const Z_INICIO = 40;		/* nuvens comecam um pouco atras do aviao */
const Z_FIM = -700;		/* e se estendem ate o fundo do percurso inicial */

/* Gerador pseudo-aleatorio com semente: o cenario eh sempre o mesmo */
function mulberry32(seed) {
	return function () {
		seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/* Geometria e material compartilhados por todas as nuvens */
const geometriaPuff = new THREE.SphereGeometry(1, 16, 12);
const materialNuvem = new THREE.MeshPhongMaterial({
	color: 0xffffff,
	emissive: 0xaaaaaa,	/* brilho proprio: com a luz atual a nuvem ficaria cinza */
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
		nuvem.add(puff);
	}
	return nuvem;
}

export function createNuvens() {
	const rand = mulberry32(12345);
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