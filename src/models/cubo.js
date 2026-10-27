import * as THREE from 'three';

/* cubo.js eh um exemplo de entidade 
 * mantido aqui apenas como referencia */

/* Contrato de entidade (todo arquivo em models/ e world/ segue):
 *   object: THREE.Object3D adicionado na cena (Mesh ou Group)
 *   update(dt): chamada a cada frame; dt = segundos desde o frame anterior */

export function createCubo() {
	const mesh = 
		new THREE.Mesh(
			new THREE.BoxGeometry(1, 1, 1),
			new THREE.MeshPhongMaterial({color: 0x44aa88})
		);
	return {
		object: mesh,
		update(dt) { mesh.rotation.y += 1.0 * dt; }	/* 1 rad/s */
	}
}