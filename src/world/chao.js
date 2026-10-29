import * as THREE from 'three';

/* Chao - segue o contrato de entidade, ver models/cubo.js */

export const CHAO_Y = -30;	/* altura do chao; o aviao voa em y ~ 0 */

export function createChao() {
	const chao = new THREE.Mesh(
		new THREE.PlaneGeometry(4000, 4000),
		new THREE.MeshPhongMaterial({
			color: 0x4a9a62,
			emissive: 0x1a4026,	/* brilho proprio: evita o chao escuro com a luz atual */
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