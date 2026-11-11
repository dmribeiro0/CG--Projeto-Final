import * as THREE from 'three';
import { carregaTextura } from '../textura.js';

/* Chao - segue o contrato de entidade, ver models/cubo.js */

const TAMANHO = 4000;	/* lado do chao, em metros */
const TELHA = 20;		/* metros cobertos por uma repeticao da imagem */

export const CHAO_Y = -30;	/* altura do chao; o aviao voa em y ~ 0 */

export function createChao() {
	const chao = new THREE.Mesh(
		new THREE.PlaneGeometry(TAMANHO, TAMANHO),
		new THREE.MeshPhongMaterial({
			/* Sem repeat, 1 imagem de 1024 px cobriria 4 km (~4 m por pixel) */
			map: carregaTextura('grama.jpg', { repetir: [TAMANHO / TELHA, TAMANHO / TELHA] }),
			shininess: 0		/* chao fosco */
		})
	);
	chao.rotation.x = -Math.PI / 2;	/* plano nasce em pe; deita ele */
	chao.position.y = CHAO_Y;

	return {
		object: chao,
		update(dt) {}	/* Chao estatico */
	}
}