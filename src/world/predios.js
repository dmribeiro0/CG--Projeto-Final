import * as THREE from 'three';
import { CHAO_Y } from './chao.js';
import { mulberry32 } from '../aleatorio.js';
import { BORDA_CALCADA } from './rua.js';
import { carregaTextura } from '../textura.js';

/* Predios nas laterais do percurso - segue o contrato de entidade
 * Texturas de fachada (ambientCG, CC0):
 *   vidro:  Facade006,  https://ambientcg.com/view?id=Facade006
 *   tijolo: Facade018A, https://ambientcg.com/view?id=Facade018A */

const POR_LADO = 22;
const Z_INICIO = 20;
const Z_FIM = -700;
const X_MIN = BORDA_CALCADA;	/* fachada alinhada a calcada; mantem o corredor do aviao livre */

/* telha:   metros cobertos por uma repeticao da imagem (largura = altura, imagem quadrada)
 * andares: linhas de janelas em uma repeticao; a altura do predio vira multiplo de telha / andares */
const FACHADAS = [
	{ arquivo: 'predio_vidro.jpg',  telha: 24, andares: 8, shininess: 60 },	/* vidro: brilho especular alto */
	{ arquivo: 'predio_tijolo.jpg', telha: 13, andares: 6, shininess: 5 }	/* tijolo: fosco */
];

export function createPredios() {
	const rand = mulberry32(2024);
	const grupo = new THREE.Group();

	/* Materiais compartilhados: cada fachada em 2 tons (color multiplica a textura) + teto liso */
	const paredes = FACHADAS.flatMap(f => [0xffffff, 0xdde3ea].map(cor => ({
		fachada: f,
		material: new THREE.MeshPhongMaterial({ map: carregaTextura(f.arquivo), color: cor, shininess: f.shininess })
	})));
	const teto = new THREE.MeshPhongMaterial({ color: 0x8a939e, shininess: 10 });

	const passo = (Z_INICIO - Z_FIM) / POR_LADO;

	for (const lado of [-1, 1]) {
		for (let i = 0; i < POR_LADO; i++) {
			const w = 10 + rand() * 12;
			const d = 10 + rand() * 12;
			const hSorteada = 15 + rand() * 40;
			const { fachada, material: parede } = paredes[Math.floor(rand() * paredes.length)];

			/* Altura com numero inteiro de andares: a ultima linha de janelas nao sai cortada */
			const andar = fachada.telha / fachada.andares;
			const h = Math.max(4, Math.round(hSorteada / andar)) * andar;

			const geo = new THREE.BoxGeometry(w, h, d);
			/* Escala as UVs para a janela manter o mesmo tamanho em qualquer predio:
			 * numa face de 26 m com telha de 13 m, u vai de 0 a 2 (2 repeticoes; RepeatWrapping) */
			const uv = geo.attributes.uv;
			for (let k = 0; k < uv.count; k++) {
				const face = Math.floor(k / 4);		/* ordem: +x, -x, +y, -y, +z, -z */
				const largura = face < 2 ? d : w;
				uv.setXY(k, uv.getX(k) * largura / fachada.telha, uv.getY(k) * h / fachada.telha);
			}

			const predio = new THREE.Mesh(geo, [parede, parede, teto, teto, parede, parede]);
			predio.position.set(
				lado * (X_MIN + w / 2 + rand() * 2),	/* recuo de ate 2 m em relacao a calcada */
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
