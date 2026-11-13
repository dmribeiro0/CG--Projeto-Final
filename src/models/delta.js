import * as THREE from 'three';
import { carregaTextura } from '../textura.js';

/* delta.js: inimigo em formato de caça com asa delta */

const TELHA = 1;
const NORMAL = 3;
const COR_ASA = 0xc8c8c8;

/* Cilindro/cone: u vai em volta, v ao longo do comprimento. u repete um número inteiro de vezes em
	volta; v é escalado para a chapa continuar quadrada, sem esticar */
function uvRevolucao(geo, circunferencia, comprimento) {
	const voltas = Math.max(1, Math.round(circunferencia / TELHA));
	const uv = geo.attributes.uv;
	for (let k = 0; k < uv.count; k++) {
		uv.setXY(k, uv.getX(k) * voltas, uv.getY(k) * comprimento * voltas / circunferencia);
	}
}
 
// Caixa w x h x d. Ordem das faces no BoxGeometry: +x, -x, +y, -y, +z, -z (4 vértices cada).
function uvCaixa(geo, w, h, d) {
	const uv = geo.attributes.uv;
	for (let k = 0; k < uv.count; k++) {
		const face = Math.floor(k / 4);
		const [su, sv] = face < 2 ? [d, h] : face < 4 ? [w, d] : [w, h];
		uv.setXY(k, uv.getX(k) * su / TELHA, uv.getY(k) * sv / TELHA);
	}
}
 
/* Prisma extrudado (asa): as tampas usam projeção planar: u = x e v = y do contorno, em metros.
	a lateral (8 cm de espessura) projeta ao longo da própria aresta: u = distancia ao longo dela e
	v = profundidade. a normal de cada vertice diz quem é tampa e quem é lateral.
(!) tem que rodar ANTES do rotateX, quando o contorno está no plano XY. */
function uvPlanar(geo) {
	const pos = geo.attributes.position;
	const nor = geo.attributes.normal;
	const uv = geo.attributes.uv;
	for (let k = 0; k < uv.count; k++) {
		if (Math.abs(nor.getZ(k)) > 0.5) {
			uv.setXY(k, pos.getX(k) / TELHA, pos.getY(k) / TELHA);
		} else {
			const tx = -nor.getY(k), ty = nor.getX(k);	// tangente da aresta, no plano XY
			uv.setXY(k, (pos.getX(k) * tx + pos.getY(k) * ty) / TELHA, pos.getZ(k) / TELHA);
		}
	}
}

export function createDelta() {
	const delta = new THREE.Group();

	// Mapas compartilhados pelo corpo e pela asa
	const metal = carregaTextura('delta_metal.jpg');
	const metalRelevo = carregaTextura('delta_metal_normal.jpg', {cor: false});

	// Corpo: a textura já carrega a cor, então color fica branco
	const matCorpo = new THREE.MeshPhongMaterial({
		map: metal,
		normalMap: metalRelevo,
		normalScale: new THREE.Vector2(NORMAL, NORMAL),
		shininess: 70}
	);
	const metalEscuro = carregaTextura('delta_metal_escuro.jpg');
	const matEscuro = new THREE.MeshPhongMaterial({
		map: metalEscuro,
		shininess: 60}
	);

	// Corpo: tronco de cone deitado no eixo Z (raioTopo = frente, -Z)
	const corpoGeo = new THREE.CylinderGeometry(0.3, 0.22, 3, 20);
	uvRevolucao(corpoGeo, 2 * Math.PI * 0.26, 3); // circunferencia média, 3 m de comprimento
	corpoGeo.rotateX(-Math.PI / 2);
	const corpo = new THREE.Mesh(corpoGeo, matCorpo);
	delta.add(corpo);

	// Nariz: cone apontando para -Z
	const narizGeo = new THREE.ConeGeometry(0.3, 0.7, 20);
	uvRevolucao(narizGeo, 2 * Math.PI * 0.3, Math.hypot(0.7, 0.3));
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
	const matAsa = new THREE.MeshPhongMaterial({
		map: metal,
		normalMap: metalRelevo,
		normalScale: new THREE.Vector2(NORMAL, NORMAL),
		color: COR_ASA,
		shininess: 40
	});
	const asaShape = new THREE.Shape();
	asaShape.moveTo(0, 1.6);	 // ponta do triângulo (frente)
	asaShape.lineTo(2.2, -1.7);	 // ponta da asa direita
	asaShape.lineTo(0, -1.1);	 // centro, recuado
	asaShape.lineTo(-2.2, -1.7); // ponta da asa esquerda
	asaShape.closePath();
	const asaGeo = new THREE.ExtrudeGeometry(asaShape, {depth: 0.08, bevelEnabled: false});
	uvPlanar(asaGeo);
	asaGeo.rotateX(-Math.PI / 2);
	asaGeo.translate(0, -0.04, 0);
	const asa = new THREE.Mesh(asaGeo, matAsa);
	delta.add(asa);

	// Canhões: dois cilindros deitados no eixo Z
	const raioCanhao = 0.15;
	const canhaoGeo = new THREE.CylinderGeometry(raioCanhao, raioCanhao, 1.6, 16);
	uvRevolucao(canhaoGeo, 2 * Math.PI * raioCanhao, 1.6);
	canhaoGeo.rotateX(-Math.PI / 2);
	const canhaoDir = new THREE.Mesh(canhaoGeo, matEscuro);
	canhaoDir.position.set(0.8, -(0.03 + raioCanhao), 0);
	const canhaoEsq = new THREE.Mesh(canhaoGeo, matEscuro);
	canhaoEsq.position.set(-0.8, -(0.03 + raioCanhao), 0);
	delta.add(canhaoDir, canhaoEsq);

	// Deriva: dois paralelepípedos finos
	const derivaGeo = new THREE.BoxGeometry(0.06, 0.8, 0.9);
	uvCaixa(derivaGeo, 0.06, 0.8, 0.9);
	const derivaDir = new THREE.Mesh(derivaGeo, matCorpo);
	derivaDir.position.set(0.45, 0.4, 0.7);
	derivaDir.rotation.z = -0.25;
	const derivaEsq = new THREE.Mesh(derivaGeo, matCorpo);
	derivaEsq.position.set(-0.45, 0.4, 0.7);
	derivaEsq.rotation.z = 0.25;
	delta.add(derivaDir, derivaEsq);

	// Turbina traseira: tronco de cone deitado no eixo Z
	const matTurbinaTampa = new THREE.MeshPhongMaterial({ // interior escuro da saída
		color: 0x0d0f13,
		shininess: 10
	});
	const turbinaGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 16);
	uvRevolucao(turbinaGeo, 2 * Math.PI * 0.225, Math.hypot(0.4, 0.05));
	turbinaGeo.rotateX(-Math.PI / 2);
	// Grupos do cilindro: 0 = lateral, 1 = tampa da frente, 2 = tampa de tras
	const turbina = new THREE.Mesh(turbinaGeo, [matEscuro, matTurbinaTampa, matTurbinaTampa]);
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