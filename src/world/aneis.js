import * as THREE from 'three';

/* Aneis bonus - segue o contrato de entidade, ver models/cubo.js
 * Cada anel eh um toro com o eixo em Z: o aviao o atravessa voando em -Z. */

const QTD_ANEIS = 12;
const Z_PRIMEIRO = -60;		/* posicao do primeiro anel */
const ESPACAMENTO = 50;		/* distancia em Z entre aneis */
const RAIO = 4;				/* raio do anel (furo) */
const TUBO = 0.5;			/* espessura do tubo */
const DESVIO = 8;			/* deslocamento maximo em X e Y */
const VELOCIDADE_GIRO = 1.0;	/* rad/s em torno do eixo Z */

export function createAneis() {
	const grupo = new THREE.Group();
	const aneis = [];

	/* Geometria e material compartilhados por todos os aneis */
	const geometria = new THREE.TorusGeometry(RAIO, TUBO, 16, 48);
	const material = new THREE.MeshPhongMaterial({
		color: 0xffd54a,
		emissive: 0xaa7700,	/* brilho proprio: destaca o anel contra o ceu */
		shininess: 80
	});

	for (let i = 0; i < QTD_ANEIS; i++) {
		const anel = new THREE.Mesh(geometria, material);
		/* Padrao em zigue-zague, deterministico (sem Math.random) */
		anel.position.set(
			Math.sin(i * 1.3) * DESVIO,
			Math.cos(i * 0.9) * DESVIO * 0.6,
			Z_PRIMEIRO - i * ESPACAMENTO
		);
		grupo.add(anel);
		aneis.push(anel);
	}

	return {
		object: grupo,
		aneis,	/* exposto para a colisao e o object pooling futuros */
		update(dt) {
			for (const anel of aneis) {
				anel.rotation.z += VELOCIDADE_GIRO * dt;
			}
		}
	}
}