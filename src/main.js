import * as THREE from 'three';
import { createCameras } from './cameras.js';
import { createHud } from './hud.js';
import { aoPressionar } from './teclado.js';
/* Importar aqui cada entidade */
import { createCubo } from './models/cubo.js';
import { createAviao } from './models/aviao.js';
import { createDrone } from './models/drone.js';
import { createDelta } from './models/delta.js';
import { createLuzes, alternar } from './world/luzes.js';
import { createAjudantes } from './world/ajudantes.js';
import { createCeu } from './world/ceu.js';
import { createChao } from './world/chao.js';
import { createRua } from './world/rua.js';
import { createPredios } from './world/predios.js';
import { createNuvens } from './world/nuvens.js';
import { createAneis } from './world/aneis.js';
import { createControleFov } from './world/projecao.js';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xbfe3ff, 250, 900);	/* Neblina da cor do horizonte: esconde o fim do cenario */

const renderer = new THREE.WebGLRenderer();
/* Tamanho do canvas em pixels (viewport = janela inteira) */
renderer.setSize(
	window.innerWidth,
	window.innerHeight
);

/* Insere o canvas no html */
document.body.appendChild(renderer.domElement);

/* Adiciona na cena e registra para o update(dt) do loop */
function adicionar(entidade) {
	scene.add(entidade.object);
	entidades.push(entidade);
	return entidade;
}

/* Entidades atualizadas a cada frame pelo loop */
const entidades = [];

/* Inserir aqui as entidades */
const luzes = adicionar(createLuzes());
const ajudantes = adicionar(createAjudantes());	/* grid de 1 m e eixos; comecam escondidos */
// adicionar(createCubo());	/* apenas um exemplo de entidade, descomente a linha para mostrar */

/* Cenario: o percurso se estende a frente do aviao, no sentido -Z */
const ceu = adicionar(createCeu());
adicionar(createChao());		/* 30 m abaixo da altura de voo */
adicionar(createRua());			/* avenida e calcadas sob o percurso */
adicionar(createPredios());
adicionar(createNuvens());
adicionar(createAneis());		/* primeiro anel em z = -60 */

/* Personagens: aviao na origem; inimigos a frente, virados para o aviao (+Z) */
const aviao = adicionar(createAviao());

const drone = adicionar(createDrone());
drone.object.position.set(-4, 2, -10);

const delta = adicionar(createDelta());
delta.object.position.set(5, 3, -18);
delta.object.rotation.y = Math.PI;	/* frente do modelo (-Z) passa a apontar para o aviao */

/* Cameras: depois das entidades, porque algumas ficam presas ao aviao */
const cameras = createCameras({ renderer, aviao });

/* Controle de FOV (projecao perspectiva): muda o FOV em todas as cameras */
const fov = createControleFov(() => cameras.todas);

/* Controles: toda tecla do jogo eh ligada aqui (mapa de teclas em teclado.js) */
aoPressionar('trocarCamera',	() => cameras.trocar());
aoPressionar('luzAmbiente',		() => alternar(luzes.luzes.ambiente));
aoPressionar('luzSol',			() => alternar(luzes.luzes.sol));
aoPressionar('luzFarol',		() => alternar(aviao.luzes.farol));
aoPressionar('luzNavegacao',	() => { alternar(aviao.luzes.navEsq); alternar(aviao.luzes.navDir); });
aoPressionar('modoNoite',		() => luzes.alternarNoite({ ceu: ceu.object.material, fog: scene.fog }));
aoPressionar('ajudantes',		() => ajudantes.alternar());
aoPressionar('aumentarFov',		() => fov.aumentar());
aoPressionar('diminuirFov',		() => fov.diminuir());
aoPressionar('resetarFov',		() => fov.resetar());
aoPressionar('hud',				() => hud.alternar());

/* HUD: depois dos controles, porque a legenda lista as teclas ja ligadas.
 * Mostra as luzes globais e as do aviao (o spread ignora `aviao.luzes` enquanto nao existir) */
const hud = createHud({ cameras, fov, luzes: { ...luzes.luzes, ...aviao.luzes } });

/* Ao redimensionar a janela: atualiza aspect, projecao e canvas */
window.addEventListener('resize', () => {
	cameras.redimensionar(window.innerWidth / window.innerHeight);
	renderer.setSize(window.innerWidth, window.innerHeight);
});

/* Loop: atualiza as entidades e desenha um frame */
let anterior = performance.now();

renderer.setAnimationLoop((tempo) => {
	/* dt em segundos; limitado a 0.1 para nao dar salto ao voltar de outra aba */
	const dt = Math.min((tempo - anterior) / 1000, 0.1);
	anterior = tempo;

	for (const entidade of entidades) {
		entidade.update(dt);
	}
	cameras.update(dt);	/* depois das entidades: a camera segue a posicao ja atualizada do aviao */
	hud.update();

	/* MATRIZ DE PROJECAO - aplicada aqui: o render envia cameras.ativa.projectionMatrix ao vertex
	 * shader como uniform. La, gl_Position = projectionMatrix * mvPosition, e depois a GPU divide
	 * x, y e z por w: eh essa divisao que deixa menor o que esta longe. Definida em cameras.js */
	renderer.render(scene, cameras.ativa);
});
