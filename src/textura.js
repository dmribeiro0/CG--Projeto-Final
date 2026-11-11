import * as THREE from 'three';

/* Carregamento de texturas de imagem (arquivos em assets/texturas/).
 *
 * A textura so diz COMO ler a imagem (repeticao, filtro, espaco de cor).
 * PARA QUE ela serve (cor, relevo, brilho) eh decidido no material do modelo:
 *   new THREE.MeshPhongMaterial({ map: carregaTextura('metal.jpg') })
 * Ver a secao "Texturas" do README. */

const PASTA = 'assets/texturas/';	/* relativo ao index.html, nao a este arquivo */

const PREENCHIMENTO = {
	repetir:  THREE.RepeatWrapping,			/* ladrilho */
	espelhar: THREE.MirroredRepeatWrapping,	/* ladrilho espelhado, esconde a emenda */
	esticar:  THREE.ClampToEdgeWrapping		/* fora de [0, 1] repete o pixel da borda */
};

const loader = new THREE.TextureLoader();	/* um loader para o jogo todo */
const cache = new Map();					/* mesmo arquivo + mesmas opcoes -> mesma textura */

/* arquivo: nome dentro de assets/texturas/ (ex.: 'grama.jpg')
 * opcoes (todas opcionais):
 *   repetir:       [u, v]  quantas vezes a imagem cabe na face (padrao [1, 1])
 *   preenchimento: 'repetir' | 'espelhar' | 'esticar'  o que ler quando o UV passa de [0, 1]
 *   deslocar:      [u, v]  arrasta a imagem na face, em fracoes da imagem (padrao [0, 0])
 *   girar:         angulo em radianos, em torno do centro da imagem (padrao 0)
 *   pixelado:      true -> pixels nitidos de perto, em vez de suavizados
 *   cor:           false -> imagem de dados (normalMap, specularMap), sem conversao sRGB */
export function carregaTextura(arquivo, {
	repetir = [1, 1],
	preenchimento = 'repetir',
	deslocar = [0, 0],
	girar = 0,
	pixelado = false,
	cor = true
} = {}) {
	if (!(preenchimento in PREENCHIMENTO))
		throw new Error(`textura.js: preenchimento '${preenchimento}' invalido (use repetir, espelhar ou esticar)`);

	/* repeat/offset ficam na Texture: dois usos com opcoes diferentes precisam de objetos diferentes */
	const chave = JSON.stringify([arquivo, repetir, preenchimento, deslocar, girar, pixelado, cor]);
	if (cache.has(chave)) return cache.get(chave);

	/* load() devolve a Texture na hora; a imagem chega depois e o Three.js envia para a GPU sozinho */
	const textura = loader.load(
		PASTA + arquivo,
		undefined,
		undefined,
		() => console.error(`textura.js: nao achei ${PASTA + arquivo}`)
	);

	textura.wrapS = textura.wrapT = PREENCHIMENTO[preenchimento];
	textura.repeat.set(...repetir);
	textura.offset.set(...deslocar);
	textura.center.set(0.5, 0.5);	/* girar em torno do centro, nao do canto (0, 0) */
	textura.rotation = girar;

	if (pixelado) textura.magFilter = THREE.NearestFilter;

	/* jpg/png de cor estao em sRGB; o calculo de luz eh linear. Mapas de dados nao sao cor */
	textura.colorSpace = cor ? THREE.SRGBColorSpace : THREE.NoColorSpace;

	/* melhora o chao visto em angulo raso; o renderer limita ao maximo da GPU */
	textura.anisotropy = 8;

	cache.set(chave, textura);
	return textura;
}
