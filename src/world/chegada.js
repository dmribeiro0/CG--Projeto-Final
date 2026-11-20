import * as THREE from 'three';
import { CHAO_Y } from './chao.js';
import { BORDA_CALCADA } from './rua.js';
import { META } from '../config.js';

/* Linha de chegada - segue o contrato de entidade, ver models/cubo.js
 * Fica em z = -META, onde a partida termina em vitoria (main.js: controle.distancia >= META).
 * Tres pecas:
 *   faixa:   xadrez no asfalto, de uma calcada a outra (so a faixa do meio de x = -16 a 16)
 *   pilares: um de cada lado, na calcada, rente a fachada dos predios; sao solidos (caixas)
 *   portico: viga alta com "CHEGADA" e bordas em xadrez; fica acima da altura maxima de voo (y = 10)
 * Texturas desenhadas num canvas: nenhum arquivo de imagem novo. */

const CASA = 1;						/* m: lado de cada quadrado da faixa */
const LARGURA_FAIXA = 32;			/* m: de pista a pista, passando pelo canteiro (|x| <= 16) */
const PROFUNDIDADE_FAIXA = 3;		/* m em z: 3 fileiras de quadrados; o centro eh a linha da META */

const PILAR_X = BORDA_CALCADA - 1;	/* 25 m: encostado na fachada (que comeca em 26) */
const PILAR_LADO = 1.2;				/* m */
const CASA_PILAR = 0.6;				/* m: quadrado do xadrez do pilar */
const VIGA_BAIXO = 12;				/* m: o aviao voa ate y = 10, com folga para a hitbox */
const VIGA_ALTURA = 5;				/* m */
const VIGA_PROFUNDIDADE = 1.5;		/* m */

/* Xadrez em canvas: colunas x linhas de quadrados (preto e branco), com pixels nitidos */
function criarXadrez(colunas, linhas, px = 16) {
	const canvas = document.createElement('canvas');
	canvas.width = colunas * px;
	canvas.height = linhas * px;
	const ctx = canvas.getContext('2d');
	for (let l = 0; l < linhas; l++) {
		for (let c = 0; c < colunas; c++) {
			ctx.fillStyle = (c + l) % 2 ? '#f4f4f4' : '#161616';
			ctx.fillRect(c * px, l * px, px, px);
		}
	}
	return canvas;
}

function texturaDe(canvas, { repetir = [1, 1], pixelado = false } = {}) {
	const textura = new THREE.CanvasTexture(canvas);
	textura.colorSpace = THREE.SRGBColorSpace;
	textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
	textura.repeat.set(...repetir);
	textura.anisotropy = 8;
	if (pixelado) textura.magFilter = THREE.NearestFilter;
	return textura;
}

/* Faixa da viga: xadrez em cima e embaixo, "CHEGADA" repetido no meio. 2048 x 200 px para
 * 51,2 x 5 m: 40 px por metro nos dois eixos, entao os quadrados saem quadrados */
function criarCanvasViga() {
	const L = 2048, A = 200, borda = 25;
	const canvas = document.createElement('canvas');
	canvas.width = L;
	canvas.height = A;
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#12203a';
	ctx.fillRect(0, 0, L, A);
	for (let c = 0; c < L / borda; c++) {
		for (let l = 0; l < 2; l++) {
			ctx.fillStyle = (c + l) % 2 ? '#f4f4f4' : '#161616';
			ctx.fillRect(c * borda, l === 0 ? 0 : A - borda, borda, borda);
		}
	}

	ctx.fillStyle = '#f2f5fa';
	ctx.font = '800 118px ui-monospace, monospace';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	for (const x of [L * 0.2, L * 0.5, L * 0.8]) ctx.fillText('CHEGADA', x, A / 2 + 4);
	return canvas;
}

export function createChegada({ z = -META } = {}) {
	const grupo = new THREE.Group();
	const caixas = [];	/* pilares: o combate trata como os predios (empurra, tira uma vida) */

	/* Faixa no asfalto. polygonOffset evita o "tremido" com a rua, que esta quase na mesma altura */
	const faixa = new THREE.Mesh(
		new THREE.PlaneGeometry(LARGURA_FAIXA, PROFUNDIDADE_FAIXA),
		new THREE.MeshPhongMaterial({
			map: texturaDe(criarXadrez(LARGURA_FAIXA / CASA, PROFUNDIDADE_FAIXA / CASA), { pixelado: true }),
			shininess: 5,
			polygonOffset: true,
			polygonOffsetFactor: -2,
			polygonOffsetUnits: -2
		})
	);
	faixa.rotation.x = -Math.PI / 2;
	faixa.position.set(0, CHAO_Y + 0.05, z);
	grupo.add(faixa);

	/* Pilares: do chao ate o topo da viga */
	const topo = VIGA_BAIXO + VIGA_ALTURA;
	const alturaPilar = topo - CHAO_Y;
	const materialPilar = new THREE.MeshPhongMaterial({
		map: texturaDe(criarXadrez(2, 2), { repetir: [PILAR_LADO / CASA_PILAR / 2, alturaPilar / CASA_PILAR / 2], pixelado: true }),
		shininess: 20
	});
	const geoPilar = new THREE.BoxGeometry(PILAR_LADO, alturaPilar, PILAR_LADO);
	for (const lado of [-1, 1]) {
		const pilar = new THREE.Mesh(geoPilar, materialPilar);
		pilar.position.set(lado * PILAR_X, CHAO_Y + alturaPilar / 2, z);
		grupo.add(pilar);
		pilar.updateMatrixWorld(true);
		caixas.push(new THREE.Box3().setFromObject(pilar));
	}

	/* Viga entre os pilares. Ordem das faces: +x, -x, +y, -y, +z, -z.
	 * +z eh a que o aviao ve chegando; -z leva a imagem espelhada para o texto nao sair ao contrario */
	const canvasViga = criarCanvasViga();
	const texturaFrente = texturaDe(canvasViga);
	const texturaTras = texturaDe(canvasViga, { repetir: [-1, 1] });
	texturaTras.offset.x = 1;
	const frente = new THREE.MeshPhongMaterial({ map: texturaFrente, shininess: 20 });
	const tras = new THREE.MeshPhongMaterial({ map: texturaTras, shininess: 20 });
	const lateral = new THREE.MeshPhongMaterial({ color: 0x161616, shininess: 20 });

	const viga = new THREE.Mesh(
		new THREE.BoxGeometry(2 * PILAR_X + PILAR_LADO, VIGA_ALTURA, VIGA_PROFUNDIDADE),
		[lateral, lateral, lateral, lateral, frente, tras]
	);
	viga.position.set(0, VIGA_BAIXO + VIGA_ALTURA / 2, z);
	grupo.add(viga);

	return {
		object: grupo,
		caixas,
		update(dt) {}	/* Linha de chegada estatica */
	}
}
