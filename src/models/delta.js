import * as THREE from 'three';

/* delta.js: inimigo em formato de caça com asa delta */

export function createDelta() {
	const delta = new THREE.Group();

	// Corpo: tronco de cone deitado no eixo Z (raioTopo = frente, -Z)
	const matCorpo = new THREE.MeshPhongMaterial({color: 0x4a5160, shininess: 70});
	const corpoGeo = new THREE.CylinderGeometry(0.3, 0.22, 3, 20);
	corpoGeo.rotateX(-Math.PI / 2);
	const corpo = new THREE.Mesh(corpoGeo, matCorpo);
	delta.add(corpo);

	// Nariz: cone apontando para -Z
	const narizGeo = new THREE.ConeGeometry(0.3, 0.7, 20);
	narizGeo.rotateX(-Math.PI / 2);
	const nariz = new THREE.Mesh(narizGeo, matCorpo);
	nariz.position.z = -1.85;
	delta.add(nariz);

	// Cabine: esfera esticada no eixo Z
	const matVidro = new THREE.MeshPhongMaterial({
		color: 0x66ddff,
		shininess: 120,
		transparent: true,
		opacity: 0.8
	});
	const cabine = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), matVidro);
	cabine.scale.set(0.8, 0.8, 2.0);
	cabine.position.set(0, 0.25, -0.7);
	delta.add(cabine);

	// Asa delta: prisma com base de quadrilátero côncavo, extrudado com a espessura em Y
	const matAsa = new THREE.MeshPhongMaterial({color: 0x2f343f, shininess: 40});
	const asaShape = new THREE.Shape();
	asaShape.moveTo(0, 1.6);	 // ponta do triângulo (frente)
	asaShape.lineTo(2.2, -1.7);	 // ponta da asa direita
	asaShape.lineTo(0, -1.1);	 // centro, recuado
	asaShape.lineTo(-2.2, -1.7); // ponta da asa esquerda
	asaShape.closePath();
	const asaGeo = new THREE.ExtrudeGeometry(asaShape, {depth: 0.08, bevelEnabled: false});
	asaGeo.rotateX(-Math.PI / 2);
	asaGeo.translate(0, -0.04, 0);
	const asa = new THREE.Mesh(asaGeo, matAsa);
	delta.add(asa);

	// Canhões: dois cilindros deitados no eixo Z
	const raioCanhao = 0.15;
	const canhaoGeo = new THREE.CylinderGeometry(raioCanhao, raioCanhao, 1.6, 16);
	canhaoGeo.rotateX(-Math.PI / 2);
	const canhaoDir = new THREE.Mesh(canhaoGeo, matCorpo);
	canhaoDir.position.set(0.8, -(0.03 + raioCanhao), 0);
	const canhaoEsq = new THREE.Mesh(canhaoGeo, matCorpo);
	canhaoEsq.position.set(-0.8, -(0.03 + raioCanhao), 0);
	delta.add(canhaoDir, canhaoEsq);

	// Deriva: dois paralelepípedos finos
	const derivaGeo = new THREE.BoxGeometry(0.06, 0.8, 0.9);
	const derivaDir = new THREE.Mesh(derivaGeo, matCorpo);
	derivaDir.position.set(0.45, 0.4, 0.7);
	derivaDir.rotation.z = -0.25;
	const derivaEsq = new THREE.Mesh(derivaGeo, matCorpo);
	derivaEsq.position.set(-0.45, 0.4, 0.7);
	derivaEsq.rotation.z = 0.25;
	delta.add(derivaDir, derivaEsq);

	// Turbina traseira: tronco de cone deitado no eixo Z
	const matTurbina = new THREE.MeshPhongMaterial({color: 0x1c1f26, shininess: 30});
	const turbinaGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 16);
	turbinaGeo.rotateX(-Math.PI / 2);
	const turbina = new THREE.Mesh(turbinaGeo, matTurbina);
	turbina.position.z = 1.6;
	delta.add(turbina);

    // Animação
	let t = 0;
	return {
		object: delta,
		update(dt) {
			t += dt;
            delta.rotation.z = Math.sin(t * 1.5) * 0.12;	// balanço lateral (roll)
		    delta.rotation.x = Math.sin(t * 2.0) * 0.03;	// arfagem leve (pitch)
		}
	};
}