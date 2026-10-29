import * as THREE from 'three';

/* drone.js: inimigo em formato de disco voador */

export function createDrone() {
	const drone = new THREE.Group();

	/* Corpo: esfera achatada no eixo Y (vira um disco) */
	const corpoGeo = new THREE.SphereGeometry(1, 32, 16);
	const corpoMat = new THREE.MeshPhongMaterial({color: 0x8a8f99, shininess: 80});
	const corpo = new THREE.Mesh(corpoGeo, corpoMat);
	corpo.scale.set(1, 0.3, 1);
	drone.add(corpo);

	/* Cupula: meia esfera, apoiada em cima do corpo */
	const cupulaGeo = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
	const cupulaMat = new THREE.MeshPhongMaterial({
		color: 0x66ddff,
		shininess: 120,
		transparent: true,
		opacity: 0.8
	});
	const cupula = new THREE.Mesh(cupulaGeo, cupulaMat);
	cupula.position.y = 0.25;
	drone.add(cupula);

	/* Anel: torus deitado na borda do disco (nasce em pe, por isso rotation.x) */
	const anelGeo = new THREE.TorusGeometry(1, 0.06, 12, 48);
	const anelMat = new THREE.MeshPhongMaterial({color: 0x333840, shininess: 40});
	const anel = new THREE.Mesh(anelGeo, anelMat);
	anel.rotation.x = Math.PI / 2;
	drone.add(anel);

	/* Luzes: 4 esferas emissivas dentro de um Group proprio (o carrossel) */
	const luzes = new THREE.Group();
	const luzGeo = new THREE.SphereGeometry(0.1, 12, 8);
	const luzMat = new THREE.MeshPhongMaterial({color: 0xff4040, emissive: 0xff2020});

	const luz1 = new THREE.Mesh(luzGeo, luzMat);
	luz1.position.set(0.8, -0.2, 0);
	const luz2 = new THREE.Mesh(luzGeo, luzMat);
	luz2.position.set(-0.8, -0.2, 0);
	const luz3 = new THREE.Mesh(luzGeo, luzMat);
	luz3.position.set(0, -0.2, 0.8);
	const luz4 = new THREE.Mesh(luzGeo, luzMat);
	luz4.position.set(0, -0.2, -0.8);

	luzes.add(luz1, luz2, luz3, luz4);
	drone.add(luzes);

	return {
		object: drone,
			update(dt) { luzes.rotation.y += 2.0 * dt; }	/* 2 rad/s */
	};
}