import * as THREE from 'three';
import { mulberry32 } from '../aleatorio.js';
import { carregaTextura } from '../textura.js';

/* Nuvens do cenario - segue o contrato de entidade, ver models/cubo.js
 * Cada nuvem eh um Group com varias esferas achatadas ("puffs") sobrepostas. */

const QTD_NUVENS = 55;
const Z_INICIO = 40;		/* nuvens comecam um pouco atras do aviao */
const Z_FIM = -960;		/* e se estendem ate a borda da neblina (900 m) */
const TRECHO = Z_INICIO - Z_FIM;	/* m: o aviao passou da nuvem, ela volta TRECHO metros a frente */

/* Geometria e material compartilhados por todas as nuvens */
const geometriaPuff = new THREE.SphereGeometry(1, 16, 12);
/* Textura de nuvem: recorte do Day Sky HDRI 069 B do ambientCG (CC0), https://ambientcg.com/view?id=DaySkyHDRI069B
 * (ver assets/texturas/nuvem*.png; recorte simples do panorama).
 * u e v do SphereGeometry vao de 0 a 1 em volta da esfera; repetir [2, 1] da 2 "voltas" de textura
 * na longitude, para os detalhes nao ficarem grandes demais numa esfera achatada.
 * 'espelhar' vira a imagem a cada repeticao: as bordas se encontram e nao aparece emenda,
 * entao qualquer recorte serve, sem precisar ser uma textura de ladrilho */
const REP = { repetir: [2, 1], preenchimento: 'espelhar' };
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

export function createNuvens({ aviao } = {}) {
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

	const zInicial = grupo.children.map((nuvem) => nuvem.position.z);

	/* Reciclagem: so existem QTD_NUVENS, e o percurso eh de 3 km. A nuvem que ficou para tras
	 * volta para a frente do aviao, escondida pela neblina: o ceu nunca esvazia */
	return {
		object: grupo,
		/* Ao reiniciar o aviao volta a z = 0: sem isto, as nuvens ja recicladas ficariam
		 * lá na frente e o inicio do percurso ficaria sem nuvens */
		reiniciar() {
			grupo.children.forEach((nuvem, i) => { nuvem.position.z = zInicial[i]; });
		},
		update(dt) {
			if (!aviao) return;
			const limite = aviao.object.position.z + 80;
			for (const nuvem of grupo.children) {
				if (nuvem.position.z > limite) nuvem.position.z -= TRECHO;
			}
		}
	}
}