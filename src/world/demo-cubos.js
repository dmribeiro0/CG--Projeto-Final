import * as THREE from 'three';

/* Cubos de demonstração da projeção perspectiva

!! este arquivo existe SOMENTE na branch demo/projecao, para o relatório

Cubos IGUAIS (2 m) em distâncias crescentes: a diferença de tamanho que aparece na tela
vem apenas da perspectiva. */

const PARES = 8;		// 8 cubos de cada lado
const Z_PRIMEIRO = -10;	// primeiro par, perto do avião
const ESPACAMENTO = 20;	// distância em Z entre os pares (último em z = -150)
const X_LADO = 16;		// afastados do corredor do avião e dos aneis (que vão até |x| ~ 14)
const TAMANHO = 2;		// todos os cubos tem 2 m: so a distância muda */

export function createFileiraCubos() {
	const grupo = new THREE.Group();
	const geometria = new THREE.BoxGeometry(TAMANHO, TAMANHO, TAMANHO);

	for (let i = 0; i < PARES; i++) { // uma cor por par, para dar para contar e comparar os cubos na imagem
		const material = new THREE.MeshPhongMaterial({
			color: new THREE.Color().setHSL((i / PARES) * 0.9, 0.9, 0.4),
			shininess: 30
		});
		for (const lado of [-0.7, 0.7]) {
			const cubo = new THREE.Mesh(geometria, material);
			cubo.position.set(lado * X_LADO, 0, Z_PRIMEIRO - i * ESPACAMENTO);
			grupo.add(cubo);
		}
	}

	return {
		object: grupo,
		update(dt) {} // cubos estáticos
	};
}