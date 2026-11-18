import * as THREE from 'three';
import { segurando } from '../teclado.js';
import { CHAO_Y } from '../world/chao.js';
import { BORDA_CALCADA } from '../world/rua.js';

/* Controle do aviao (shooter sobre trilho): o aviao avanca sozinho em -Z e o jogador
 * o move em X e Y com W A S D, dentro do corredor da avenida.
 *
 * Move so o aviao.object (grupo externo). O balanco do modelo fica no grupo interno
 * (models/aviao.js): os dois se somam, e este arquivo nao mexe no modelo.
 *
 * Interface usada pelo main.js:
 *   update(dt): chamada a cada frame, antes do update das entidades
 *   reiniciar(): volta o aviao ao ponto de partida, parado
 *   distancia: metros percorridos desde a partida (leitura) */

const VELOCIDADE_FRENTE = 30;	/* m/s em -Z: 3 km em 100 s */
const VELOCIDADE_LADO = 18;		/* m/s maxima em X e em Y */
const RESPOSTA = 6;				/* 1/s: rapidez com que a velocidade chega ao pedido do jogador */

/* Corredor de voo: entre as calcadas e acima da rua, assim o aviao nunca entra num predio */
const MEIA_ENVERGADURA = 3.5;	/* ponta da asa em models/aviao.js */
const LIMITE_X = BORDA_CALCADA - MEIA_ENVERGADURA - 4.5;	/* 18 m: 4,5 m de folga ate a fachada */
const Y_MIN = CHAO_Y + 10;		/* -20: 10 m acima da rua */
const Y_MAX = 10;

/* Inclinacao na velocidade maxima: o aviao "deita" para o lado da curva e levanta o nariz ao subir */
const ROLAGEM_MAX = 0.6;	/* rad em Z */
const ARFAGEM_MAX = 0.25;	/* rad em X */

export function createControleAviao(aviao) {
	const inicio = aviao.object.position.clone();
	const velocidade = new THREE.Vector2();	/* x e y; a frente eh constante */

	return {
		get distancia() { return inicio.z - aviao.object.position.z; },

		update(dt) {
			/* Pedido do jogador em cada eixo: -1, 0 ou 1 (Number(true) = 1) */
			const pedidoX = Number(segurando('direita')) - Number(segurando('esquerda'));
			const pedidoY = Number(segurando('subir')) - Number(segurando('descer'));

			/* A velocidade se aproxima do pedido aos poucos: sem tranco ao apertar ou soltar.
			 * 1 - e^(-k dt) faz a curva ser a mesma a 30 ou a 144 FPS (um fator fixo por frame nao faria) */
			const suavizar = 1 - Math.exp(-RESPOSTA * dt);
			velocidade.x += (pedidoX * VELOCIDADE_LADO - velocidade.x) * suavizar;
			velocidade.y += (pedidoY * VELOCIDADE_LADO - velocidade.y) * suavizar;

			/* Posicao += velocidade * dt (integracao de Euler) */
			const p = aviao.object.position;
			p.x = THREE.MathUtils.clamp(p.x + velocidade.x * dt, -LIMITE_X, LIMITE_X);
			p.y = THREE.MathUtils.clamp(p.y + velocidade.y * dt, Y_MIN, Y_MAX);
			p.z -= VELOCIDADE_FRENTE * dt;

			/* Rolagem: velocidade para +X abaixa a asa direita (rotacao negativa em Z).
			 * Arfagem: rotacao positiva em X levanta o nariz (frente em -Z) */
			aviao.object.rotation.z = -velocidade.x / VELOCIDADE_LADO * ROLAGEM_MAX;
			aviao.object.rotation.x = velocidade.y / VELOCIDADE_LADO * ARFAGEM_MAX;
		},

		reiniciar() {
			aviao.object.position.copy(inicio);
			aviao.object.rotation.set(0, 0, 0);
			velocidade.set(0, 0);
		}
	};
}
