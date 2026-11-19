import * as THREE from 'three';
import { segmentoTocaHitbox } from '../colisao.js';

/* Mira: mostra para onde o tiro do aviao vai.
 *
 * Eh um objeto 3D na linha do tiro, DISTANCIA metros a frente, e nao um desenho fixo na tela:
 * assim ela diz a verdade em qualquer posicao do aviao. Por causa da perspectiva, ela anda na tela
 * menos que o aviao (esta mais longe da camera), sem nenhuma conta extra.
 *
 * Origem e direcao sao as mesmas do disparo em combate.js (atirar): nariz do aviao (ancora farol)
 * e a frente do aviao.object. Se o disparo mudar la, mudar aqui tambem.
 *
 * Fica verde quando a linha do tiro passa por um inimigo ativo (mesmo teste de colisao do combate).
 *
 * Interface usada pelo main.js:
 *   object: adicionado na cena
 *   update(): chamada a cada frame durante a partida, DEPOIS de combate.update() (hitboxes atualizadas) */

const DISTANCIA = 30;		/* m a frente do aviao; igual a escolta do drone (jogo/inimigos.js): para ele, mira exata */
const ALCANCE = 150;		/* m da linha testada contra os inimigos (o tiro anda 150 m/s) */
const RAIO_TIRO = 0.8;		/* raioColisao do tiro do aviao em world/tiros.js (mudar junto) */
const TAMANHO = 0.07;		/* fracao da altura da tela (sizeAttenuation: false) */
const COR_LIVRE = 0xffffff;
const COR_NO_ALVO = 0x3dff6e;

/* Desenho da mira em um canvas: anel com 4 tracos. Branco, para a cor do material tingir */
function criarTextura() {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 128;
	const ctx = canvas.getContext('2d');
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 8;
	ctx.beginPath();
	ctx.arc(64, 64, 40, 0, 2 * Math.PI);
	ctx.stroke();
	for (const [x0, y0, x1, y1] of [[64, 4, 64, 34], [64, 94, 64, 124], [4, 64, 34, 64], [94, 64, 124, 64]]) {
		ctx.beginPath();
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.stroke();
	}
	const textura = new THREE.CanvasTexture(canvas);
	textura.colorSpace = THREE.SRGBColorSpace;
	return textura;
}

export function createMira({ aviao, combate }) {
	/* Sprite: sempre de frente para a camera.
	 * sizeAttenuation false: mesmo tamanho na tela a qualquer distancia
	 * depthTest false + renderOrder alto: desenhada por cima de tudo (nao some atras de predio)
	 * fog false: a neblina nao a apaga */
	const material = new THREE.SpriteMaterial({
		map: criarTextura(),
		color: COR_LIVRE,
		sizeAttenuation: false,
		depthTest: false,
		depthWrite: false,
		fog: false,
		transparent: true
	});
	const sprite = new THREE.Sprite(material);
	sprite.scale.setScalar(TAMANHO);
	sprite.renderOrder = 999;

	/* Vetores reutilizados a cada frame */
	const origem = new THREE.Vector3();
	const direcao = new THREE.Vector3();
	const fim = new THREE.Vector3();
	const quat = new THREE.Quaternion();

	return {
		object: sprite,

		update() {
			/* Mesma linha do disparo (combate.js, atirar) */
			const ancora = aviao.ancoras?.farol ?? aviao.object;
			ancora.getWorldPosition(origem);
			aviao.object.getWorldQuaternion(quat);
			direcao.set(0, 0, -1).applyQuaternion(quat);

			sprite.position.copy(origem).addScaledVector(direcao, DISTANCIA);

			/* No alvo: a linha do tiro, ate ALCANCE, passa por algum inimigo ativo */
			fim.copy(origem).addScaledVector(direcao, ALCANCE);
			const noAlvo = combate.inimigos.some((e) => e.ativo && segmentoTocaHitbox(origem, fim, RAIO_TIRO, e.hitbox));
			material.color.setHex(noAlvo ? COR_NO_ALVO : COR_LIVRE);
		}
	};
}
