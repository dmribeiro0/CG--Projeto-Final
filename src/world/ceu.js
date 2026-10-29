import * as THREE from 'three';

/* Ceu (skybox) - segue o contrato de entidade, ver models/cubo.js */

/* Gradiente vertical desenhado em um canvas, usado como textura.
 * Topo = azul profundo, horizonte = azul claro/branco, base = branco azulado */
function criarTexturaCeu() {
	const canvas = document.createElement('canvas');
	canvas.width = 2;
	canvas.height = 512;
	const ctx = canvas.getContext('2d');

	const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height);
	gradiente.addColorStop(0.00, '#1c5fb8');	/* zenite */
	gradiente.addColorStop(0.35, '#4a9be8');
	gradiente.addColorStop(0.50, '#bfe3ff');	/* horizonte */
	gradiente.addColorStop(0.65, '#e8f4ff');
	gradiente.addColorStop(1.00, '#ffffff');	/* abaixo do horizonte */
	ctx.fillStyle = gradiente;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const textura = new THREE.CanvasTexture(canvas);
	textura.colorSpace = THREE.SRGBColorSpace;
	return textura;
}

export function createCeu() {
	/* Esfera grande vista por dentro. Raio 800 < plano distante da camera (1000) */
	const esfera = new THREE.Mesh(
		new THREE.SphereGeometry(800, 32, 16),
		new THREE.MeshBasicMaterial({
			map: criarTexturaCeu(),
			side: THREE.BackSide,	/* desenha a face de dentro */
			depthWrite: false
		})
	);
	esfera.renderOrder = -1;	/* desenhada antes de todo o resto */

	return {
		object: esfera,
		update(dt) {}	/* Ceu estatico */
	}
}

new THREE.MeshBasicMaterial({
	map: criarTexturaCeu(),
	side: THREE.BackSide,
	depthWrite: false,
	fog: false	
})