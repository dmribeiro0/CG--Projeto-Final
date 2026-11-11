import * as THREE from 'three';
import { carregaTextura } from '../textura.js';
import { mulberry32 } from '../aleatorio.js';

/* Chao - segue o contrato de entidade, ver models/cubo.js
 * Textura: Grass005 do ambientCG (CC0), https://ambientcg.com/view?id=Grass005 */

const TAMANHO = 4000;	/* lado do chao, em metros */
const TELHA = 20;		/* metros cobertos por uma repeticao da imagem */
const DIVISOES = 200;	/* quadrados por lado: um vertice a cada 20 m, para a variacao de cor */

/* Ruido suave: valores aleatorios numa grade de `celulas` x `celulas`,
 * interpolados entre os 4 cantos da celula (bilinear). Devolve f(u, v) em [0, 1] */
function criarRuido(celulas, rand) {
	const grade = Array.from({ length: (celulas + 1) ** 2 }, () => rand());
	const valor = (i, j) => grade[j * (celulas + 1) + i];
	const suave = t => t * t * (3 - 2 * t);	/* smoothstep: tira as quinas da interpolacao */

	return (u, v) => {
		const x = u * celulas, y = v * celulas;
		const i = Math.min(Math.floor(x), celulas - 1), j = Math.min(Math.floor(y), celulas - 1);
		const fx = suave(x - i), fy = suave(y - j);
		const baixo = valor(i, j) * (1 - fx) + valor(i + 1, j) * fx;
		const cima = valor(i, j + 1) * (1 - fx) + valor(i + 1, j + 1) * fx;
		return baixo * (1 - fy) + cima * fy;
	};
}

/* Cor por vertice: manchas de grama mais escura e mais seca.
 * Como `color` multiplica a textura, as manchas quebram o padrao repetido a cada TELHA metros */
function colorirVertices(geo) {
	const rand = mulberry32(7);
	const manchas = criarRuido(40, rand);	/* manchas de ~100 m */
	const detalhe = criarRuido(130, rand);	/* variacao de ~30 m */

	const escura = new THREE.Color(0.50, 0.72, 0.45);
	const seca = new THREE.Color(1.10, 1.02, 0.70);
	const cor = new THREE.Color();

	const uv = geo.attributes.uv;
	const cores = new Float32Array(uv.count * 3);
	for (let k = 0; k < uv.count; k++) {
		const u = uv.getX(k), v = uv.getY(k);
		const t = 0.7 * manchas(u, v) + 0.3 * detalhe(u, v);
		cor.lerpColors(escura, seca, t).toArray(cores, k * 3);
	}
	geo.setAttribute('color', new THREE.BufferAttribute(cores, 3));
}

export const CHAO_Y = -30;	/* altura do chao; o aviao voa em y ~ 0 */

export function createChao() {
	const geo = new THREE.PlaneGeometry(TAMANHO, TAMANHO, DIVISOES, DIVISOES);
	colorirVertices(geo);

	/* Sem repeat, 1 imagem de 1024 px cobriria 4 km (~4 m por pixel).
	 * Mesmo `repetir` nos dois mapas, senao o relevo sai desalinhado da cor */
	const rep = { repetir: [TAMANHO / TELHA, TAMANHO / TELHA] };

	const chao = new THREE.Mesh(
		geo,
		new THREE.MeshPhongMaterial({
			map: carregaTextura('grama.jpg', rep),
			normalMap: carregaTextura('grama_normal.jpg', { ...rep, cor: false }),	/* relevo: reage ao sol e ao farol */
			vertexColors: true,	/* usa o atributo 'color' de cada vertice */
			shininess: 0		/* chao fosco */
		})
	);
	chao.rotation.x = -Math.PI / 2;	/* plano nasce em pe; deita ele */
	chao.position.y = CHAO_Y;

	return {
		object: chao,
		update(dt) {}	/* Chao estatico */
	}
}
