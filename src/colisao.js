import * as THREE from 'three';

/* Geometria da colisão

Testes:
	hitboxesSeCruzam(a, b) = esferas x esferas (corpo x corpo)
    segmentoTocaHitbox(p0, p1, r) = trajeto do tiro no frame x esferas; testa o SEGMENTO, não só o ponto,
	porque um tiro rapido pula 2 m por frame e atravessaria */

export const HITBOX = { // hitbox de cada entidade, em coordenadas do modelo (frente em -Z, 1 unidade = 1 m)
	aviao: [
		[0, 0, -2.4, 0.6],  // nariz
		[0, 0, -1.2, 0.7],  // frente do corpo
		[0, 0, 0.2, 0.7],   // meio
		[0, 0.3, 1.8, 0.7], // cauda e deriva
		[-1.2, -0.1, -0.2, 0.6], [1.2, -0.1, -0.2, 0.6], // asas: 3 esferas por lado, cobrindo os 3,5 m até a ponta
		[-2.4, -0.1, -0.2, 0.6], [2.4, -0.1, -0.2, 0.6], 
		[-3.4, -0.1, -0.2, 0.6], [3.4, -0.1, -0.2, 0.6]
	],
	drone: [
		[0, 0.1, 0, 1.0] // disco de 1 m de raio: uma esfera envolvente basta
	],
	delta: [
		[0, 0, -1.6, 0.5],	 // nariz
		[0, 0.1, -0.6, 0.7], // cabine
		[0, 0.1, 0.5, 0.8],	 // meio, com as derivas
		[0, 0.1, 1.5, 0.6],	 // turbina
		[-1.0, 0, 0.2, 0.7], [1.0, 0, 0.2, 0.7], // asa delta: raiz
		[-1.9, 0, 1.3, 0.6], [1.9, 0, 1.3, 0.6]	 // asa delta: pontas (recuadas em +Z)
	]
};

export class Hitbox { // esferas de um objeto (coordenadas do mundo). Chamar atualizar() 1x por frame
	constructor(object, esferas) {
		this.object = object;
		this.esferas = esferas.map(([x, y, z, r]) => ({
			local: new THREE.Vector3(x, y, z),
			r,
			centro: new THREE.Vector3(), // mundo, preenchido por atualizar()
			raio: r
		}));
	}

	atualizar() {
		this.object.updateWorldMatrix(true, false);
		const m = this.object.matrixWorld;
		const escala = m.getMaxScaleOnAxis();
		for (const e of this.esferas) {
			e.centro.copy(e.local).applyMatrix4(m);
			e.raio = e.r * escala;
		}
	}
}

export function hitboxesSeCruzam(a, b) {
	for (const ea of a.esferas) {
		for (const eb of b.esferas) {
			const soma = ea.raio + eb.raio;
			if (ea.centro.distanceToSquared(eb.centro) <= soma * soma) return true;
		}
	}
	return false;
}

const _d = new THREE.Vector3();
const _w = new THREE.Vector3();

export function segmentoTocaEsfera(p0, p1, raioSegmento, centro, raio) {
	_d.subVectors(p1, p0);
	const comprimento2 = _d.lengthSq();
	let t = 0;
	if (comprimento2 > 1e-12) {
		_w.subVectors(centro, p0);
		t = THREE.MathUtils.clamp(_w.dot(_d) / comprimento2, 0, 1);	// ponto do segmento mais próximo do centro
	}
	_w.copy(p0).addScaledVector(_d, t);
	const soma = raio + raioSegmento;
	return _w.distanceToSquared(centro) <= soma * soma;
}

export function segmentoTocaHitbox(p0, p1, raioSegmento, hitbox) {
	for (const e of hitbox.esferas) {
		if (segmentoTocaEsfera(p0, p1, raioSegmento, e.centro, e.raio)) return true;
	}
	return false;
}

const _p = new THREE.Vector3();

/* Hitbox (esferas) x predio (Box3, alinhado aos eixos).
 * Se alguma esfera entrar na caixa, soma em `empurrao` o deslocamento que tira o aviao de dentro
 * e devolve true. A saida eh SEMPRE para o corredor (x) ou para cima (y), nunca em z:
 * o aviao avanca sozinho, e empurrar para tras o deixaria grudado na parede.
 *   x: pela face voltada ao corredor da avenida (o predio fica a esquerda ou a direita)
 *   y: pelo teto, quando o aviao desce sobre um predio baixo
 * Escolhe UM eixo por predio (o de menor deslocamento para tirar todas as esferas): se cada
 * esfera escolhesse o seu, o aviao saltaria na diagonal (x e y ao mesmo tempo) */
export function empurrarParaForaDaCaixa(hitbox, caixa, empurrao) {
	let bateu = false;
	let penX = 0, penY = 0;	/* quanto a pior esfera entrou, em cada saida possivel */
	const lado = Math.sign(caixa.min.x + caixa.max.x) || 1;	/* +1: predio a direita */
	for (const e of hitbox.esferas) {
		caixa.clampPoint(e.centro, _p);	/* ponto da caixa mais proximo do centro da esfera */
		if (_p.distanceToSquared(e.centro) > e.raio * e.raio) continue;	/* nao encosta */
		bateu = true;
		penX = Math.max(penX, lado > 0 ? e.centro.x + e.raio - caixa.min.x : caixa.max.x - (e.centro.x - e.raio));
		penY = Math.max(penY, caixa.max.y - (e.centro.y - e.raio));
	}
	if (!bateu) return false;

	if (penX <= penY) {
		const x = -lado * penX;
		if (Math.abs(x) > Math.abs(empurrao.x)) empurrao.x = x;
	} else if (penY > empurrao.y) {
		empurrao.y = penY;
	}
	return true;
}
