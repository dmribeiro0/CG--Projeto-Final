import * as THREE from 'three';
import { createCameras } from './cameras.js';
import { createHud } from './hud.js';
import { aoPressionar } from './teclado.js';
import { createRelevo } from './relevo.js';
import { createPartida } from './partida.js';
import { createCombate } from './combate.js';
/* Importar aqui cada entidade */
import { createCubo } from './models/cubo.js';
import { createAviao } from './models/aviao.js';
import { createLuzes, alternar } from './world/luzes.js';
import { createAjudantes } from './world/ajudantes.js';
import { createCeu } from './world/ceu.js';
import { createChao } from './world/chao.js';
import { createRua } from './world/rua.js';
import { createPredios } from './world/predios.js';
import { createNuvens } from './world/nuvens.js';
import { createAneis } from './world/aneis.js';
import { createTiros } from './world/tiros.js';
import { createControleFov } from './world/projecao.js';
/* Comportamento (jogo/): move as entidades sem mexer nos arquivos dos modelos */
import { createControleAviao } from './jogo/controle.js';
import { createInimigos } from './jogo/inimigos.js';
import { createPercursoAneis } from './jogo/aneis.js';
import { createMira } from './jogo/mira.js';

/* Meta: metros ate a vitoria. Valor unico do jogo: a partida, os aneis e os inimigos se distribuem por ele */
const META = 1000;

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
const aneis = adicionar(createAneis({ comprimento: META }));	/* um anel a cada 50 m, de z = -60 ate a meta */
const tiros = adicionar(createTiros());		/* projeteis do aviao e dos inimigos */

/* Personagens: aviao na origem */
const aviao = adicionar(createAviao());
const controle = createControleAviao(aviao);	/* W A S D move; avanca sozinho em -Z */

/* Combate: depois das entidades, porque usa o aviao, os aneis e os tiros.
 * Cada inimigo precisa ser registrado para poder ser acertado, atirar e colidir. */
const combate = createCombate({ aviao, tiros, aneis });

/* Inimigos: espalhados ate a meta, criados e registrados no combate por jogo/inimigos.js */
const inimigos = createInimigos({ adicionar, combate, aviao, meta: META });
const percursoAneis = createPercursoAneis(aneis);	/* X e Y dos aneis sorteados a cada partida */

/* Mira: na linha do tiro; nao entra em `entidades` porque precisa rodar depois do combate (ver loop) */
const mira = createMira({ aviao, combate });
scene.add(mira.object);

/* Cameras: depois das entidades, porque algumas ficam presas ao aviao */
const cameras = createCameras({ renderer, aviao });

/* Controle de FOV (projecao perspectiva): muda o FOV em todas as cameras */
const fov = createControleFov(() => cameras.todas);

/* Relevo: depois das entidades, para achar os materiais */
const relevo = createRelevo(scene);

/* Partida: pontos, vidas e fim de jogo. Os modulos chamam partida.ganharPontos(), perderVida() e vencer() */
const partida = createPartida({ meta: META });	/* META definida no topo */
partida.aoReiniciar(() => controle.reiniciar());	/* Enter: aviao volta ao inicio */
partida.aoReiniciar(() => combate.reiniciar());		/* inimigos, aneis e tiros tambem */
/* Depois do combate: ele devolve inimigos e aneis ao estado inicial, e estes sorteiam posicoes novas */
partida.aoReiniciar(() => inimigos.reiniciar());
partida.aoReiniciar(() => percursoAneis.reiniciar());

/* O combate so avisa o que aconteceu (combate.on); aqui o jogo decide o que cada coisa vale */
const PONTOS = { anel: 100, drone: 200, delta: 300 };
combate.on('anelColetado',	() => partida.ganharPontos(PONTOS.anel));
combate.on('inimigoAbatido',	({ tipo, por }) => { if (por === 'tiro') partida.ganharPontos(PONTOS[tipo]); });
combate.on('aviaoDanificado',	({ dano }) => { for (let i = 0; i < dano; i++) partida.perderVida(); });

/* Controles: toda tecla do jogo eh ligada aqui (mapa de teclas em teclado.js) */
aoPressionar('trocarCamera',	() => cameras.trocar());
aoPressionar('luzAmbiente',		() => alternar(luzes.luzes.ambiente));
aoPressionar('luzSol',			() => alternar(luzes.luzes.sol));
aoPressionar('luzFarol',		() => alternar(aviao.luzes.farol));
aoPressionar('luzNavegacao',	() => { alternar(aviao.luzes.navEsq); alternar(aviao.luzes.navDir); });
aoPressionar('modoNoite',		() => luzes.alternarNoite({ ceu: ceu.object.material, fog: scene.fog }));
aoPressionar('relevo',			() => relevo.alternar());
aoPressionar('reiniciar',		() => partida.reiniciar());
aoPressionar('ajudantes',		() => ajudantes.alternar());
aoPressionar('aumentarFov',		() => fov.aumentar());
aoPressionar('diminuirFov',		() => fov.diminuir());
aoPressionar('resetarFov',		() => fov.resetar());
aoPressionar('hud',				() => hud.alternar());

/* HUD: depois dos controles, porque a legenda lista as teclas ja ligadas.
 * Mostra as luzes globais e as do aviao (o spread ignora `aviao.luzes` enquanto nao existir) */
const hud = createHud({ cameras, fov, relevo, luzes: { ...luzes.luzes, ...aviao.luzes } });

/* Ao redimensionar a janela: atualiza aspect, projecao e canvas */
window.addEventListener('resize', () => {
	cameras.redimensionar(window.innerWidth / window.innerHeight);
	renderer.setSize(window.innerWidth, window.innerHeight);
});

/* Loop: atualiza as entidades e desenha um frame.
 * Ordem fixa, porque cada etapa usa o resultado da anterior:
 *   controle -> inimigos -> entidades (animacoes) -> combate -> mira -> camera -> HUD -> render
 * Ex.: a camera vem depois do controle; ao contrario, usaria a posicao do frame anterior e tremeria */
let anterior = performance.now();

renderer.setAnimationLoop((tempo) => {
	/* dt em segundos; limitado a 0.1 para nao dar salto ao voltar de outra aba */
	const dt = Math.min((tempo - anterior) / 1000, 0.1);
	anterior = tempo;

	/* Move aviao e inimigos so durante a partida; antes das entidades e da camera.
	 * Inimigos depois do controle: acordam e miram pela posicao ja atualizada do aviao */
	if (partida.estado === 'jogando') {
		controle.update(dt);
		inimigos.update(dt);
		partida.atualizarDistancia(controle.distancia);
		if (controle.distancia >= META) partida.vencer();
	}
	for (const entidade of entidades) {
		entidade.update(dt);
	}
	/* Combate so durante a partida; depois das entidades (ja se moveram) e antes da camera */
	if (partida.estado === 'jogando') {
		combate.update(dt);
		mira.update();	/* depois do combate: usa as hitboxes ja atualizadas neste frame */
	}
	cameras.update(dt);	/* depois das entidades: a camera segue a posicao ja atualizada do aviao */
	hud.update();

	/* MATRIZ DE PROJECAO - aplicada aqui: o render envia cameras.ativa.projectionMatrix ao vertex
	 * shader como uniform. La, gl_Position = projectionMatrix * mvPosition, e depois a GPU divide
	 * x, y e z por w: eh essa divisao que deixa menor o que esta longe. Definida em cameras.js */
	renderer.render(scene, cameras.ativa);
});
