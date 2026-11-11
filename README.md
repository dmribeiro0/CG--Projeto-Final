# Sky Shooter

Shooter 3D sobre trilho (estilo Star Fox), projeto final de Computação Gráfica (UNIFESP-ICT), feito com Three.js.

## Como rodar

Na raiz do repositório, com um dos comandos (ambos funcionam):

```bash
python -m http.server   # abrir http://localhost:8000
npx serve               # abrir http://localhost:3000
```

Abrir o `index.html` direto no navegador não funciona: módulos ES exigem um servidor.

## Estrutura

```
index.html          página e importmap do Three.js
styles.css
assets/
└── texturas/       imagens das texturas (.jpg, .png)
src/
├── main.js         cena, renderer, entidades, controles (teclas) e loop
├── cameras.js      câmeras, troca entre elas, resize
├── hud.js          painel com câmera, FOV e luzes, mais a legenda das teclas
├── teclado.js      mapa de teclas
├── textura.js      carregaTextura(): carrega e configura uma imagem de assets/texturas/
├── aleatorio.js    gerador pseudo-aleatório com semente (mulberry32)
├── models/         personagens (avião, inimigos)
└── world/          cenário e luzes globais
```

## Como adicionar uma entidade

1. Criar o arquivo em `src/models/` (personagem) ou `src/world/` (cenário), usando `src/models/cubo.js` como referência.
2. Exportar uma função `createX()` que retorna `{ object, update(dt) }`:
   - `object`: `THREE.Object3D` adicionado na cena (`Mesh` ou `Group`);
   - `update(dt)`: chamada a cada frame; `dt` = segundos desde o frame anterior.
   - opcional `ancoras`: `{ nome: THREE.Object3D }`, pontos do modelo onde outros módulos prendem coisas (ver abaixo);
   - opcional `luzes`: `{ nome: THREE.Light }`, luzes criadas pela entidade; o `main.js` liga cada uma a uma tecla.
3. Seguir as convenções: Y para cima, frente em −Z, origem no centro do modelo, 1 unidade = 1 m, `MeshPhongMaterial`.
4. Importar em `src/main.js`, no bloco `/* Importar aqui cada entidade */`.
5. Chamar `adicionar(createX())` no bloco `/* Inserir aqui as entidades */`.

## Âncoras

Uma âncora é um `THREE.Object3D` vazio (sem geometria) posicionado dentro do modelo para marcar um ponto: o cockpit, o nariz, a ponta da asa. Como é filho do modelo, herda o movimento dele; o que for preso na âncora (câmera, luz) vai junto.

```js
/* no modelo (ex.: aviao.js) */
const cockpit = new THREE.Object3D();
cockpit.position.set(0, 1.0, 1.3);
corpo.add(cockpit);
return { object, update, ancoras: { cockpit } };

/* em outro módulo (ex.: cameras.js) */
aviao.ancoras.cockpit.add(cameraCockpit);
```

O modelo diz **onde**; quem usa a âncora decide **o quê**. Assim ninguém precisa conhecer as peças internas do modelo de outra pessoa.

## Iluminação

- Luzes globais (ambiente, sol) ficam em `src/world/luzes.js`. Luzes que se movem com um objeto (farol, luzes de navegação) são criadas no próprio modelo, presas a uma âncora, e devolvidas em `luzes`.
- Para ligar/desligar qualquer luz: `alternar(luz)`, exportada por `src/world/luzes.js`, chamada no bloco "Controles" do `main.js`.
- `emissive` só em objeto que emite luz de verdade (ex.: as luzes do drone). Não usar `emissive` para clarear um objeto escuro: se a cena está escura, ajustar a intensidade em `luzes.js`. Com `emissive`, desligar uma luz quase não muda o objeto, e a contribuição de cada fonte deixa de aparecer.

## Texturas

A textura é lida pelas coordenadas UV da geometria (as primitivas do Three.js já trazem UV) e entra no material por uma propriedade de mapa. A **textura** diz **como** ler a imagem (repetição, filtro, espaço de cor); o **material** diz **para que** ela serve (`map` = cor, `normalMap` = relevo, `specularMap` = brilho). Como a textura substitui a cor do material antes do cálculo de luz, as luzes e o modo noite continuam valendo sobre ela.

### Passo a passo

1. Baixar a imagem no [ambientCG](https://ambientcg.com) (licença CC0, sem login), na versão **1K-JPG**. 2K ou mais pesa no repositório e no carregamento do GitHub Pages.
2. Do zip, usar o `*_Color.jpg` (cor). Opcional: `*_NormalGL.jpg` (relevo; a versão **GL**, a `NormalDX` inverte o relevo no Three.js) e `*_Roughness.jpg`.
3. Salvar em `assets/texturas/` com nome curto e o modelo no nome (ex.: `aviao_metal.jpg`, `aviao_metal_normal.jpg`).
4. Anotar o link da página da textura para o relatório.
5. No modelo, importar `carregaTextura` e usar no material:

```js
import { carregaTextura } from '../textura.js';

const metal = new THREE.MeshPhongMaterial({
	map: carregaTextura('aviao_metal.jpg', { repetir: [2, 1] }),
	shininess: 40
});
const fuselagem = new THREE.Mesh(geoCilindro, metal);
const asa = new THREE.Mesh(geoCaixa, metal);	// mesma textura; cada primitiva tem os próprios UVs
```

Passar só o nome do arquivo: o caminho é relativo ao `index.html`, e `textura.js` já acrescenta `assets/texturas/`.

### Opções de `carregaTextura(arquivo, opcoes)`

| Opção | Padrão | O que faz | No Three.js |
|---|---|---|---|
| `repetir: [u, v]` | `[1, 1]` | quantas vezes a imagem cabe na face | `repeat` |
| `preenchimento` | `'repetir'` | o que ler quando o UV passa de [0, 1]: `'repetir'`, `'espelhar'` ou `'esticar'` | `wrapS`, `wrapT` |
| `deslocar: [u, v]` | `[0, 0]` | arrasta a imagem na face (em frações da imagem) | `offset` |
| `girar` | `0` | gira a imagem em torno do centro (radianos) | `rotation`, `center` |
| `pixelado` | `false` | pixels nítidos de perto, em vez de suavizados | `magFilter = NearestFilter` |
| `cor` | `true` | `false` para imagem de dados (`normalMap`, `specularMap`) | `colorSpace` |

Para o tamanho da repetição não depender do tamanho da peça, calcular `repetir` a partir das medidas (ex.: `src/world/chao.js`, uma imagem a cada 20 m).

### Relevo e brilho (opcional)

Com o relevo, a textura reage às luzes (o farol à noite mostra o relevo). Usar o **mesmo `repetir`** nos mapas do mesmo material, senão o relevo sai desalinhado da cor:

```js
const rep = { repetir: [2, 1] };
new THREE.MeshPhongMaterial({
	map:         carregaTextura('aviao_metal.jpg', rep),
	normalMap:   carregaTextura('aviao_metal_normal.jpg', { ...rep, cor: false }),
	specularMap: carregaTextura('aviao_metal_rough.jpg',  { ...rep, cor: false }),	// aproximação: roughness é o inverso do brilho
	shininess: 40
});
```

### Erros comuns

- **Página em branco**: quase sempre é erro de módulo (import com nome errado). Abrir o console (F12).
- **Objeto sem textura** e `textura.js: nao achei ...` no console: nome ou pasta do arquivo errado.
- **Textura escura ou com outra cor**: sobrou `color` no material. `color` **multiplica** a textura; remover para ver a imagem pura.
- **Borrão** (imagem esticada) ou **textura microscópica**: ajustar `repetir`.

## Teclas

O mapa de teclas fica em `TECLAS`, em `src/teclado.js`; para criar uma tecla nova, adicionar uma linha lá (o arquivo acusa erro se o mesmo código for usado duas vezes). Cada tecla é ligada a uma função no bloco "Controles" do `src/main.js`, então lendo o `main.js` dá para ver tudo o que o jogo responde. Os módulos não ouvem o teclado: expõem funções (ex.: `cameras.trocar()`, `ajudantes.alternar()`) e o `main.js` faz a ligação.

```js
/* Controles: toda tecla do jogo eh ligada aqui (mapa de teclas em teclado.js) */
aoPressionar('trocarCamera',	() => cameras.trocar());
aoPressionar('luzSol',			() => alternar(luzes.luzes.sol));
aoPressionar('ajudantes',		() => ajudantes.alternar());
```

| Tecla | Ação |
|---|---|
| C | Trocar câmera |
| + / - | Aumentar / diminuir o FOV |
| 0 | FOV padrão |
| 1 | Luz ambiente |
| 2 | Sol |
| 3 | Farol do avião |
| 4 | Luzes de navegação |
| N | Modo noite |
| G | Grid e eixos |
| H | Mostrar/esconder HUD |

### Como adicionar uma ação de teclado

Exemplo: tecla P para pausar.

1. No módulo, expor uma função que faz a ação (sem `addEventListener`):
   ```js
   return { object, update, pausar() { pausado = !pausado; } };
   ```
2. Em `src/teclado.js`, adicionar uma linha em `TECLAS`. O nome da ação é a chave; `code` é a tecla física ([lista de códigos](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values), ex.: `KeyP`, `Digit5`, `Space`, `ArrowUp`):
   ```js
   pausar:	{ code: 'KeyP',	rotulo: 'P',	descricao: 'Pausar' },
   ```
3. Em `src/main.js`, no bloco "Controles", ligar a ação à função. Passar uma função (`() => ...`), não o resultado dela: `aoPressionar('pausar', jogo.pausar())` executaria na hora.
   ```js
   aoPressionar('pausar',	() => jogo.pausar());
   ```
4. Acrescentar a tecla na tabela acima.

Se a página abrir com erro no console `teclado.js: KeyP usado por ...`, a tecla já pertence a outra ação: escolher outra.

## Fluxo de Git

Uma branch por tarefa (ex.: `feat/aviao`), com pull request para a `main`.
