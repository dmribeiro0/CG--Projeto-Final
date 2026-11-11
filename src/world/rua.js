import * as THREE from 'three';
import { CHAO_Y } from './chao.js';
import { carregaTextura } from '../textura.js';

/* Avenida embaixo do percurso do aviao - segue o contrato de entidade, ver models/cubo.js
 * Duas pistas com canteiro central (o gramado do chao aparece entre elas) e calcadas com meio-fio.
 * Texturas (ambientCG, CC0):
 *   rua:     Road007,         https://ambientcg.com/view?id=Road007
 *   calcada: PavingStones150, https://ambientcg.com/view?id=PavingStones150
 *
 * Corte transversal (x >= 0; o lado x < 0 eh espelhado):
 *   0 ... CANTEIRO | pista ... | calcada ... | BORDA_CALCADA = predios */

const CANTEIRO = 4;			/* meia largura do canteiro central */
const PISTA = 12;			/* largura de cada pista (a imagem tem 2 faixas) */
const CALCADA = 10;			/* largura de cada calcada */
const MEIO_FIO = 0.3;		/* altura da calcada */
export const BORDA_CALCADA = CANTEIRO + PISTA + CALCADA;	/* onde os predios comecam */

const Z_INICIO = 200;		/* atras da camera */
const Z_FIM = -1000;		/* alem da neblina (900 m) */
const COMPRIMENTO = Z_INICIO - Z_FIM;
const Z_CENTRO = (Z_INICIO + Z_FIM) / 2;

/* Uma imagem de rua cobre PISTA x PISTA metros: a imagem repete so no comprimento (v),
 * nunca na largura (u), senao as linhas de borda apareceriam no meio da pista */
const REP_RUA = { repetir: [1, COMPRIMENTO / PISTA] };

/* Uma imagem de calcada (2:1) cobre 4 x 2 m */
const REP_CALCADA = { repetir: [CALCADA / 4, COMPRIMENTO / 2] };

/* polygonOffset: a pista fica quase no mesmo plano do chao; sem isso, ao longe, a
 * precisao do depth buffer nao separa os dois e a grama "pisca" por cima do asfalto */
const SOBRE_O_CHAO = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };

export function createRua() {
	const grupo = new THREE.Group();

	const materialRua = new THREE.MeshPhongMaterial({
		map: carregaTextura('rua.jpg', REP_RUA),
		normalMap: carregaTextura('rua_normal.jpg', { ...REP_RUA, cor: false }),
		shininess: 10,
		...SOBRE_O_CHAO
	});

	const materialCalcada = new THREE.MeshPhongMaterial({
		map: carregaTextura('calcada.jpg', REP_CALCADA),
		normalMap: carregaTextura('calcada_normal.jpg', { ...REP_CALCADA, cor: false }),
		shininess: 5,
		...SOBRE_O_CHAO
	});
	const materialMeioFio = new THREE.MeshPhongMaterial({ color: 0x9a9a96, shininess: 5 });

	const geoPista = new THREE.PlaneGeometry(PISTA, COMPRIMENTO);
	/* BoxGeometry: a face de cima (+y) tem u ao longo de x e v ao longo de z, igual a pista */
	const geoCalcada = new THREE.BoxGeometry(CALCADA, MEIO_FIO, COMPRIMENTO);

	for (const lado of [-1, 1]) {
		const pista = new THREE.Mesh(geoPista, materialRua);
		pista.rotation.x = -Math.PI / 2;	/* deita o plano: v da imagem passa a correr ao longo de z */
		pista.position.set(lado * (CANTEIRO + PISTA / 2), CHAO_Y, Z_CENTRO);
		grupo.add(pista);

		/* Ordem das faces da caixa: +x, -x, +y, -y, +z, -z. Textura so em cima; laterais = meio-fio */
		const calcada = new THREE.Mesh(geoCalcada, [
			materialMeioFio, materialMeioFio, materialCalcada,
			materialMeioFio, materialMeioFio, materialMeioFio
		]);
		calcada.position.set(lado * (CANTEIRO + PISTA + CALCADA / 2), CHAO_Y + MEIO_FIO / 2, Z_CENTRO);
		grupo.add(calcada);
	}

	return {
		object: grupo,
		update(dt) {}	/* Rua estatica */
	}
}
