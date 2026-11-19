import * as THREE from 'three';
import { createDrone } from '../models/drone.js';
import { createDelta } from '../models/delta.js';
import { LIMITE_X, Y_MIN, Y_MAX, VELOCIDADE_FRENTE } from './controle.js';

/* Inimigos do percurso: cria, distribui ao longo do percurso (ate a meta) e move cada um conforme o tipo.
 * Os modelos (models/drone.js, models/delta.js) so dizem como o inimigo eh; o movimento fica aqui.
 * Tiro, dano e abate sao do combate.js: cada inimigo eh registrado nele (registrarInimigo).
 *
 * Cada inimigo "dorme" parado no lugar dele e acorda quando o aviao chega perto:
 *   delta (investida): voa contra o aviao, mirando onde o aviao estava ao acordar; se passar, some
 *   drone (escolta):   vai para a frente do aviao e o acompanha ziguezagueando; depois de um tempo, vai embora
 *
 * Aleatorio a cada partida (com regras): a ordem dos tipos e a posicao de cada inimigo.
 *
 * Interface usada pelo main.js:
 *   update(dt): chamada a cada frame durante a partida, depois do controle do aviao
 *   reiniciar(): sorteia de novo. Registrar DEPOIS de combate.reiniciar(), que reativa os inimigos */

/* Distribuicao: um inimigo a cada ESPACAMENTO metros, com Z sorteado em +-SORTEIO_Z.
 * 130 +- 40 m: nunca dois inimigos a menos de 50 m um do outro */
const Z_PRIMEIRO = -220;
const ESPACAMENTO = 130;
const SORTEIO_Z = 40;
const FIM_LIVRE = 100;		/* m antes da meta sem inimigo: o ultimo encontro acontece antes da vitoria */
const MARGEM = 3;			/* m entre o inimigo e o limite do corredor de voo */

const ATRAS = 15;			/* m atras do aviao: passou da camera (12 m atras), sai do jogo */

const DELTA = {
	acordar: 250,			/* m a frente do aviao */
	velocidade: 40			/* m/s em +Z; somada aos 30 do aviao, se aproximam a 70 m/s */
};

const DRONE = {
	acordar: 150,			/* m a frente do aviao */
	distancia: 30,			/* m a frente do aviao durante a escolta (mesma distancia da mira, jogo/mira.js) */
	resposta: 1.5,			/* 1/s: rapidez com que chega a posicao de escolta (como em jogo/controle.js) */
	amplitude: 8,			/* m de ziguezague para cada lado */
	frequencia: 1.2,		/* rad/s do ziguezague */
	escolta: 6,				/* s acompanhando o aviao */
	subida: 12,				/* m/s ao ir embora */
	afastamento: 45			/* m/s a frente do aviao ao ir embora */
};

const sortear = (min, max) => min + Math.random() * (max - min);

/* meta: metros do percurso (main.js). Quantos inimigos cabem de Z_PRIMEIRO ate FIM_LIVRE antes da meta,
 * um a cada ESPACAMENTO: com 1000 m, 5; com 3000 m, 21 */
export function createInimigos({ adicionar, combate, aviao, meta }) {
	const qtd = Math.max(0, Math.floor((meta - FIM_LIVRE - SORTEIO_Z + Z_PRIMEIRO) / ESPACAMENTO) + 1);

	/* Metade de cada tipo. Os modelos sao criados uma vez; a cada partida so a ordem e a posicao mudam */
	const inimigos = [];
	for (let i = 0; i < qtd; i++) {
		const tipo = i % 2 === 0 ? 'drone' : 'delta';
		const entidade = adicionar(tipo === 'drone' ? createDrone() : createDelta());
		if (tipo === 'delta') entidade.object.rotation.y = Math.PI;	/* frente do modelo (-Z) virada para o aviao */
		const registro = combate.registrarInimigo(entidade, tipo);	/* ativo e vida ficam no combate */
		inimigos.push({
			tipo,
			registro,
			object: entidade.object,
			estado: 'dormindo',		/* 'dormindo' | 'acordado' | 'saindo' | 'fora' */
			tempo: 0,				/* s desde que acordou */
			velocidade: new THREE.Vector3(),	/* delta: velocidade da investida */
			base: new THREE.Vector2(),			/* drone: centro do ziguezague (x, y) */
			fase: 0,				/* drone: fase do ziguezague, para nao andarem todos juntos */
			frente: 0				/* drone: m a frente do aviao (estado no referencial do aviao) */
		});
	}

	/* Embaralha a ordem dos tipos (Fisher-Yates) e sorteia a posicao de cada um */
	function sortearPercurso() {
		const ordem = [...inimigos];
		for (let i = ordem.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[ordem[i], ordem[j]] = [ordem[j], ordem[i]];
		}
		ordem.forEach((inimigo, i) => {
			inimigo.object.position.set(
				sortear(-LIMITE_X + MARGEM, LIMITE_X - MARGEM),
				sortear(Y_MIN + MARGEM, Y_MAX - MARGEM),
				Z_PRIMEIRO - i * ESPACAMENTO + sortear(-SORTEIO_Z, SORTEIO_Z)
			);
			inimigo.estado = 'dormindo';
			inimigo.tempo = 0;
			inimigo.fase = Math.random() * 2 * Math.PI;
		});
	}

	/* Tira do jogo sem pontuar (escapou): o combate ignora inimigo com ativo = false */
	function retirar(inimigo) {
		inimigo.estado = 'fora';
		inimigo.registro.ativo = false;
		inimigo.object.visible = false;
	}

	function acordar(inimigo, p, aviaoP) {
		inimigo.estado = 'acordado';
		inimigo.tempo = 0;
		if (inimigo.tipo === 'delta') {
			/* Mira onde o aviao esta agora: calcula a velocidade lateral para chegar la junto com ele.
			 * Nao persegue depois: quem se mexe a tempo desvia */
			const encontro = (aviaoP.z - p.z) / (DELTA.velocidade + VELOCIDADE_FRENTE);	/* s ate o encontro */
			inimigo.velocidade.set(
				(aviaoP.x - p.x) / encontro,
				(aviaoP.y - p.y) / encontro,
				DELTA.velocidade
			);
		} else {
			inimigo.base.set(p.x, p.y);
			inimigo.frente = aviaoP.z - p.z;
		}
	}

	function moverDelta(inimigo, p, dt) {
		p.addScaledVector(inimigo.velocidade, dt);	/* posicao += velocidade * dt */
	}

	function moverDrone(inimigo, p, aviaoP, dt) {
		/* Z no referencial do aviao: inimigo.frente eh guardado entre frames e o Z vem dele.
		 * (Recalcular a partir de p.z depois que o aviao ja andou deixava o drone ~20 m atrasado) */
		const suavizar = 1 - Math.exp(-DRONE.resposta * dt);	/* mesma suavizacao de jogo/controle.js */

		if (inimigo.estado === 'acordado') {
			/* Escolta: aproxima-se de DRONE.distancia a frente e ziguezagueia em volta da base */
			const alvoX = THREE.MathUtils.clamp(
				inimigo.base.x + Math.sin(inimigo.tempo * DRONE.frequencia + inimigo.fase) * DRONE.amplitude,
				-LIMITE_X, LIMITE_X
			);
			p.x += (alvoX - p.x) * suavizar;
			p.y += (inimigo.base.y - p.y) * suavizar;
			inimigo.frente += (DRONE.distancia - inimigo.frente) * suavizar;

			if (inimigo.tempo > DRONE.escolta) inimigo.estado = 'saindo';
		} else {
			/* Saindo: sobe e se afasta a frente do aviao */
			p.y += DRONE.subida * dt;
			inimigo.frente += DRONE.afastamento * dt;
		}
		p.z = aviaoP.z - inimigo.frente;
	}

	sortearPercurso();	/* primeira partida */

	return {
		update(dt) {
			const aviaoP = aviao.object.position;
			for (const inimigo of inimigos) {
				if (inimigo.estado === 'fora') continue;
				if (!inimigo.registro.ativo) { inimigo.estado = 'fora'; continue; }	/* abatido pelo combate */

				const p = inimigo.object.position;
				const frente = aviaoP.z - p.z;	/* m a frente do aviao (negativo = atras) */

				if (inimigo.estado === 'dormindo') {
					const alcance = inimigo.tipo === 'delta' ? DELTA.acordar : DRONE.acordar;
					if (frente <= alcance) acordar(inimigo, p, aviaoP);
					continue;
				}

				inimigo.tempo += dt;
				if (inimigo.tipo === 'delta') moverDelta(inimigo, p, dt);
				else moverDrone(inimigo, p, aviaoP, dt);

				/* Escapou: passou para tras da camera, ou o drone ja foi embora (subiu alem da neblina) */
				if (frente < -ATRAS || p.y > Y_MAX + 60) retirar(inimigo);
			}
		},

		reiniciar: sortearPercurso,

		/* Leitura (testes, HUD) */
		get lista() { return inimigos; }
	};
}
