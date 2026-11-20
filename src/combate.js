import * as THREE from 'three';
import { segurando } from './teclado.js';
import { mulberry32 } from './aleatorio.js';
import { HITBOX, Hitbox, hitboxesSeCruzam, segmentoTocaHitbox, empurrarParaForaDaCaixa } from './colisao.js';

/* Combate: disparos, colisões e coleta de anéis.
- main.js chama update(dt) a cada frame, depois das entidades.
- não conhece pontuação, vidas nem telas: avisa o que aconteceu por eventos; quem escuta é o main.js (combate.on).

Interface usada pelo main.js:
	registrarInimigo(entidade, tipo) = 'drone' ou 'delta'; passa a ser alvo, atirar e colidir
	atirar() = um disparo; update chama com a tecla segurada
	update(dt)
	reiniciar() = inimigos, aneis, tiros e invulnerabilidade voltam ao inicio
	pausar() / retomar() = congelar as regras (ou só não chamar o update)
	on(nome, funcao) / off(nome, funcao) = escutar / parar de escutar um evento

Eventos (dados entre chaves):
	tiroDisparado { dono: 'aviao' | 'inimigo', inimigo? }
	inimigoAtingido { inimigo, tipo, vidaRestante }
	inimigoAbatido { inimigo, tipo, por: 'tiro' | 'colisao' }
	aviaoDanificado { causa: 'tiro' | 'drone' | 'delta' | 'predio', dano, invulneravelPor }
	aviaoBateuPredio { empurrao }  (todo frame em que o aviao encosta num predio, mesmo invulneravel; Vector3 com o deslocamento ja aplicado, valido so durante a chamada)
	anelColetado { indice, coletados, total }
	aneisCompletos { total }
	(inimigo = entidade registrada; tipo = 'drone' ou 'delta')

Leitura (HUD, tela final): aneisColetados, aneisTotal, invulneravel, inimigos */

/* ----- Regras: ajustar aqui ----- */

const CADENCIA_AVIAO = 0.18; // segundos entre tiros do avião (segurando a tecla)

// vida: tiros do avião para abater; intervalo: segundos entre tiros do inimigo;
// bocas: de onde o tiro sai, no referencial do modelo
const INIMIGOS = {
	drone: { vida: 2, intervalo: 2.6, bocas: [[0, -0.3, 0]] },
	delta:  { vida: 3, intervalo: 1.7, bocas: [[-0.8, -0.18, -0.9], [0.8, -0.18, -0.9]] }
};
const ALCANCE_INIMIGO = 140; // m: o inimigo so atira com o avião dentro desta distância
const FOLGA_FRENTE = 5;		 // m: e só se estiver pelo menos isto a frente do avião (-Z)
const DANO = { tiro: 1, drone: 1, delta: 1, predio: 1 }; // pontos de dano por causa
const INVULNERAVEL = 1;					  	  // seg sem levar dano depois de ser atingido (evita perder tudo num contato só)
const COLISAO_ABATE_INIMIGO = true;			  // bater num inimigo o destroi e o avião leva dano

const _centro = new THREE.Vector3();
const _origem = new THREE.Vector3();
const _direcao = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _posInimigo = new THREE.Vector3();
const _posAnel = new THREE.Vector3();
const _empurrao = new THREE.Vector3();
const MARGEM_PREDIO = 6; // m: so testa os predios com a caixa a esta distancia (em z) do aviao

export function createCombate({ aviao, tiros, aneis, predios }) {
	const rand = mulberry32(77);
	const hitboxAviao = new Hitbox(aviao.object, HITBOX.aviao);
	const inimigos = [];

	let pausado = false;
	let recarga = 0;
	let invulneravel = 0;
	const ouvintes = {}; // nome do evento -> funções que escutam

	const coletados = new Set(); // fica coletado o anel que o centro do avião atravessa 
	const posAnterior = new THREE.Vector3();
	let temAnterior = false;

	// EVENTOS
	function emitir(nome, dados = {}) {
		for (const funcao of ouvintes[nome] ?? []) funcao(dados);
	}

	// DANO E ABATE
	function danificarAviao(causa) { // true se o dano foi aplicado (false durante a invulnerabilidade)
		if (invulneravel > 0) return false;
		invulneravel = INVULNERAVEL;
		emitir('aviaoDanificado', { causa, dano: DANO[causa] ?? 1, invulneravelPor: INVULNERAVEL });
		return true;
	}

	function abater(inimigo, por) {
		inimigo.ativo = false;
		inimigo.entidade.object.visible = false;
		emitir('inimigoAbatido', { inimigo: inimigo.entidade, tipo: inimigo.tipo, por });
	}

	function acertarInimigo(inimigo) {
		inimigo.vida -= 1;
		emitir('inimigoAtingido', { inimigo: inimigo.entidade, tipo: inimigo.tipo, vidaRestante: Math.max(0, inimigo.vida) });
		if (inimigo.vida <= 0) abater(inimigo, 'tiro');
	}

	// DISPAROS
	function atirar() { // o tiro do avião sai da luz do nariz (ancora farol) e segue p onde o avião aponta
		if (pausado || recarga > 0) return;
		const ancora = aviao.ancoras?.farol ?? aviao.object;
		ancora.getWorldPosition(_origem);
		aviao.object.getWorldQuaternion(_quat);
		_direcao.set(0, 0, -1).applyQuaternion(_quat);
		if (!tiros.disparar('aviao', _origem, _direcao)) return;
		recarga = CADENCIA_AVIAO;
		emitir('tiroDisparado', { dono: 'aviao' });
	}

	function atirarInimigos(dt) { // inimigo atira no avião quando esta a frente dele e ao alcance; alternado
		for (const e of inimigos) {
			if (!e.ativo) continue;
			e.proximoTiro -= dt;
			if (e.proximoTiro > 0) continue;

			e.object.getWorldPosition(_posInimigo);
			const aFrente = _posInimigo.z < _centro.z - FOLGA_FRENTE;
			if (!aFrente || _posInimigo.distanceTo(_centro) > ALCANCE_INIMIGO) {
				e.proximoTiro = 0.25;
				continue;
			}

			const [x, y, z] = e.cfg.bocas[e.boca];
			_origem.set(x, y, z).applyMatrix4(e.object.matrixWorld);
			_direcao.subVectors(_centro, _origem).normalize();
			if (tiros.disparar('inimigo', _origem, _direcao)) {
				emitir('tiroDisparado', { dono: 'inimigo', inimigo: e.entidade });
			}
			e.boca = (e.boca + 1) % e.cfg.bocas.length;
			e.proximoTiro = e.cfg.intervalo;
		}
	}

	// COLISÕES
	function tirosContraInimigos() {
		for (const tiro of tiros.pool) {
			if (!tiro.ativo || tiro.dono !== 'aviao') continue;
			for (const e of inimigos) {
				if (!e.ativo) continue;
				if (segmentoTocaHitbox(tiro.anterior, tiro.mesh.position, tiro.raio, e.hitbox)) {
					tiros.desativar(tiro);
					acertarInimigo(e);
					break;
				}
			}
		}
	}

	function tirosContraAviao() {
		for (const tiro of tiros.pool) {
			if (!tiro.ativo || tiro.dono !== 'inimigo') continue;
			if (segmentoTocaHitbox(tiro.anterior, tiro.mesh.position, tiro.raio, hitboxAviao)) {
				tiros.desativar(tiro);
				danificarAviao('tiro');	// o tiro some mesmo durante a invulnerabilidade
			}
		}
	}

	function corposContraAviao() {
		for (const e of inimigos) {
			if (!e.ativo || !hitboxesSeCruzam(hitboxAviao, e.hitbox)) continue;
			danificarAviao(e.tipo);
			if (COLISAO_ABATE_INIMIGO) abater(e, 'colisao');
		}
	}

	function corpoContraPredios() { // o predio eh solido: o aviao eh empurrado para fora e leva dano (1x por invulnerabilidade)
		if (!predios) return;
		_empurrao.set(0, 0, 0);
		let bateu = false;
		for (const caixa of predios.caixas) {
			if (caixa.max.z < _centro.z - MARGEM_PREDIO || caixa.min.z > _centro.z + MARGEM_PREDIO) continue; // longe em z
			if (empurrarParaForaDaCaixa(hitboxAviao, caixa, _empurrao)) bateu = true;
		}
		if (!bateu) return;
		aviao.object.position.add(_empurrao); // sempre empurra, mesmo invulneravel: nao da para atravessar a parede
		danificarAviao('predio');
		emitir('aviaoBateuPredio', { empurrao: _empurrao });
	}

	function coletarAneis() { // conta quando o centro do avião cruza o plano do anel, de frente (-Z), por dentro dele
		if (temAnterior) {
			for (let i = 0; i < aneis.aneis.length; i++) {
				if (coletados.has(i)) continue;
				const anel = aneis.aneis[i];
				anel.getWorldPosition(_posAnel);
				const zAnel = _posAnel.z;
				if (!(posAnterior.z > zAnel && _centro.z <= zAnel)) continue;

				const t = (posAnterior.z - zAnel) / (posAnterior.z - _centro.z);
				const x = THREE.MathUtils.lerp(posAnterior.x, _centro.x, t);
				const y = THREE.MathUtils.lerp(posAnterior.y, _centro.y, t);
				const { radius, tube } = anel.geometry.parameters;
				const furo = radius - tube;	/* raio livre dentro do tubo */
				if (Math.hypot(x - _posAnel.x, y - _posAnel.y) > furo) continue;

				coletados.add(i);
				anel.visible = false;
				emitir('anelColetado', { indice: i, coletados: coletados.size, total: aneis.aneis.length });
				if (coletados.size === aneis.aneis.length) emitir('aneisCompletos', { total: coletados.size });
			}
		}
		posAnterior.copy(_centro);
		temAnterior = true;
	}

	// INTERFACE
	return {
		registrarInimigo(entidade, tipo) {
			const cfg = INIMIGOS[tipo];
			if (!cfg) throw new Error(`combate.js: tipo de inimigo '${tipo}' nao existe (use ${Object.keys(INIMIGOS).join(' ou ')})`);
			const inimigo = {
				tipo,
				entidade,
				cfg,
				object: entidade.object,
				hitbox: new Hitbox(entidade.object, HITBOX[tipo]),
				vida: cfg.vida,
				ativo: true,
				boca: 0,
				proximoTiro: cfg.intervalo * (0.5 + rand()),	  // inimigos nao atiram todos no mesmo instante
				posicaoInicial: entidade.object.position.clone(), // para o reiniciar()
				quaternionInicial: entidade.object.quaternion.clone()
			};
			inimigos.push(inimigo);
			return inimigo;
		},
		atirar,

		on(nome, funcao) { (ouvintes[nome] ??= []).push(funcao); },
		off(nome, funcao) { if (ouvintes[nome]) ouvintes[nome] = ouvintes[nome].filter((f) => f !== funcao); },

		update(dt) {
			if (pausado) return;
			recarga = Math.max(0, recarga - dt);
			invulneravel = Math.max(0, invulneravel - dt);

			aviao.object.getWorldPosition(_centro);
			hitboxAviao.atualizar();
			for (const e of inimigos) if (e.ativo) e.hitbox.atualizar();

			if (segurando('atirar')) atirar();
			atirarInimigos(dt);

			tirosContraInimigos();
			tirosContraAviao();
			corposContraAviao();
			corpoContraPredios();
			coletarAneis();
		},

		reiniciar() {
			tiros.limpar();
			recarga = 0;
			invulneravel = 0;
			temAnterior = false;
			coletados.clear();
			for (const anel of aneis.aneis) anel.visible = true;
			for (const e of inimigos) {
				e.ativo = true;
				e.vida = e.cfg.vida;
				e.boca = 0;
				e.proximoTiro = e.cfg.intervalo * (0.5 + rand());
				e.object.visible = true;
				e.object.position.copy(e.posicaoInicial);
				e.object.quaternion.copy(e.quaternionInicial);
			}
			pausado = false;
		},

		pausar() { pausado = true; },
		retomar() { pausado = false; },

		get invulneravel() { return invulneravel > 0; },
		get aneisColetados() { return coletados.size; },
		get aneisTotal() { return aneis.aneis.length; },
		inimigos,
	};
}