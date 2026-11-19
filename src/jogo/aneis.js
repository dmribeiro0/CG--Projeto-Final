import * as THREE from 'three';
import { LIMITE_X, Y_MIN, Y_MAX } from './controle.js';

/* Percurso dos aneis: sorteia X e Y de cada anel a cada partida, com regras para todo anel ser alcancavel.
 * O Z (espacamento de 50 m) continua definido em world/aneis.js; aqui so muda a posicao lateral.
 *
 * Regras:
 *   - cada anel fica a no maximo PASSO_MAX do anterior (em X e Y). Entre dois aneis o aviao tem 1,7 s
 *     (50 m a 30 m/s) e, com a aceleracao suave de jogo/controle.js, anda ~25 m de lado: 12 m eh folgado
 *   - o centro do anel fica dentro do corredor de voo, com MARGEM, para o aviao conseguir passar pelo meio
 *   - o primeiro anel sai perto da posicao inicial do aviao (0, 0)
 *
 * Interface usada pelo main.js:
 *   reiniciar(): sorteia um percurso novo. Registrar DEPOIS de combate.reiniciar(), que reexibe os aneis */

const PASSO_MAX = 12;	/* m entre os centros de dois aneis consecutivos */
const MARGEM = 2;		/* m entre o centro do anel e o limite do corredor */

export function createPercursoAneis(aneis) {
	function sortear() {
		let x = 0;
		let y = 0;
		for (const anel of aneis.aneis) {
			/* Direcao e distancia sorteadas: o passo pode ir para qualquer lado, ate PASSO_MAX */
			const angulo = Math.random() * 2 * Math.PI;
			const distancia = Math.random() * PASSO_MAX;
			x = THREE.MathUtils.clamp(x + Math.cos(angulo) * distancia, -LIMITE_X + MARGEM, LIMITE_X - MARGEM);
			y = THREE.MathUtils.clamp(y + Math.sin(angulo) * distancia, Y_MIN + MARGEM, Y_MAX - MARGEM);
			anel.position.x = x;
			anel.position.y = y;
		}
	}

	sortear();	/* primeira partida */

	return { reiniciar: sortear };
}
