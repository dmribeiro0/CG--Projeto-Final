import * as THREE from 'three';
import { CHAO_Y } from './chao.js';

/* Predios nas laterais do percurso - segue o contrato de entidade */

const POR_LADO = 22;
const Z_INICIO = 20;
const Z_FIM = -700;
const X_MIN = 30;		/* borda interna: mantem o corredor do aviao livre */
const TELHA = 8;		/* metros cobertos por uma repeticao da textura de janelas */

function mulberry32(seed) {
	return function () {
		seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/* Textura de janelas desenhada em canvas (2x2 janelas por repeticao) */
function criarTexturaJanelas() {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#d5dbe3';	/* parede */
	ctx.fillRect(0, 0, 64, 64);
	ctx.fillStyle = '#4d6f96';	/* janelas */
	for (let y = 0; y < 2; y++)
		for (let x = 0; x < 2; x++)
			ctx.fillRect(8 + x * 32, 8 + y * 32, 16, 20);

	const textura = new THREE.CanvasTexture(canvas);
	textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
	textura.colorSpace = THREE.SRGBColorSpace;
	return textura;
}

export function createPredios() {
	const rand = mulberry32(2024);
	const grupo = new THREE.Group();

	/* Materiais compartilhados: 3 tons de parede + teto liso */
	const janelas = criarTexturaJanelas();
	const paredes = [0xffffff, 0xe6ecf5, 0xcfd8e6].map(cor =>
		new THREE.MeshPhongMaterial({ map: janelas, color: cor, emissive: 0x222a33, shininess: 20 })
	);
	const teto = new THREE.MeshPhongMaterial({ color: 0x8a939e, emissive: 0x222a33, shininess: 10 });

	const passo = (Z_INICIO - Z_FIM) / POR_LADO;

	for (const lado of [-1, 1]) {
		for (let i = 0; i < POR_LADO; i++) {
			const w = 10 + rand() * 12;
			const d = 10 + rand() * 12;
			const h = 15 + rand() * 40;

			const geo = new THREE.BoxGeometry(w, h, d);
			/* Escala as UVs para a janela manter o mesmo tamanho em qualquer predio */
			const uv = geo.attributes.uv;
			for (let k = 0; k < uv.count; k++) {
				const face = Math.floor(k / 4);		/* ordem: +x, -x, +y, -y, +z, -z */
				const largura = face < 2 ? d : w;
				uv.setXY(k, uv.getX(k) * largura / TELHA, uv.getY(k) * h / TELHA);
			}

			const parede = paredes[Math.floor(rand() * paredes.length)];
			const predio = new THREE.Mesh(geo, [parede, parede, teto, teto, parede, parede]);
			predio.position.set(
				lado * (X_MIN + w / 2 + rand() * 60),
				CHAO_Y + h / 2,
				Z_INICIO - i * passo - rand() * (passo - d)	/* um predio por faixa de z: sem sobreposicao */
			);
			grupo.add(predio);
		}
	}

	return {
		object: grupo,
		update(dt) {}	/* Predios estaticos por enquanto */
	}
}