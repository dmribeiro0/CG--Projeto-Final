import * as THREE from 'three';

/* Tiros: segue o contrato de entidade (models/cubo.js)
- conjunto fixo de projéteis criado uma vez (object pooling)
	disparar() reaproveita um tiro parado em vez de criar um novo
	desativar() devolve o tiro ao conjunto

Cada tiro: { mesh, dono: 'aviao' | 'inimigo', ativo, velocidade (Vector3), anterior (Vector3), vida (s), raio } */

// velocidade (m/s) e vida (s): alcance = produto
// raio e comprimento: desenho do tiro
// raioColisao: usado nos testes de colisão (um pouco maior que o desenho do tiro do avião)
const CONFIG = {
	aviao:   { quantidade: 24, cor: 0x66f0ff, velocidade: 150, vida: 2.2, raio: 0.15, comprimento: 3.2, raioColisao: 0.8 },	// 0.8: acerto generoso (o tiro que passa raspando conta)
	inimigo: { quantidade: 48, cor: 0xff5a2a, velocidade: 45,  vida: 4.0, raio: 0.3,  comprimento: 1.4, raioColisao: 0.3 }
};

export function createTiros() {
	const grupo = new THREE.Group();
	const materiais = {};
	const pool = [];
	for (const [dono, cfg] of Object.entries(CONFIG)) {
		const geometria = new THREE.CylinderGeometry(cfg.raio, cfg.raio, cfg.comprimento, 8);
		geometria.rotateX(Math.PI / 2);
		materiais[dono] = new THREE.MeshPhongMaterial({ color: cfg.cor, emissive: cfg.cor, shininess: 60 });
		for (let i = 0; i < cfg.quantidade; i++) {
			const mesh = new THREE.Mesh(geometria, materiais[dono]);
			mesh.visible = false;
			grupo.add(mesh);
			pool.push({
				mesh, dono, ativo: false,
				velocidade: new THREE.Vector3(),
				anterior: new THREE.Vector3(),
				vida: 0, raio: cfg.raioColisao
			});
		}
	}

	const _alvo = new THREE.Vector3();
	return {
		object: grupo, pool,

		// origem: Vector3 do mundo; direcao: Vector3 unitario. Devolve o tiro ou null (se o conjunto está todo em uso)
		disparar(dono, origem, direcao) {
			const tiro = pool.find((t) => t.dono === dono && !t.ativo);
			if (!tiro) return null;
			const cfg = CONFIG[dono];
			tiro.ativo = true;
			tiro.vida = cfg.vida;
			tiro.velocidade.copy(direcao).multiplyScalar(cfg.velocidade);
			tiro.mesh.position.copy(origem);
			tiro.anterior.copy(origem);
			tiro.mesh.lookAt(_alvo.copy(origem).add(direcao));
			tiro.mesh.visible = true;
			return tiro;
		},

		desativar(tiro) {
			tiro.ativo = false;
			tiro.mesh.visible = false;
		},

		limpar() {
			for (const tiro of pool) this.desativar(tiro);
		},

		update(dt) {
			for (const tiro of pool) {
				if (!tiro.ativo) continue;
				tiro.anterior.copy(tiro.mesh.position);
				tiro.mesh.position.addScaledVector(tiro.velocidade, dt);
				tiro.vida -= dt;
				if (tiro.vida <= 0) this.desativar(tiro);
			}
		}
	};
}