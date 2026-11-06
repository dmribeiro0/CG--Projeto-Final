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
assets/             texturas e modelos externos (.jpg, .png, .glb)
src/
├── main.js         cena, renderer, entidades, controles (teclas) e loop
├── cameras.js      câmeras, troca entre elas, resize
├── hud.js          painel com câmera, FOV e luzes, mais a legenda das teclas
├── teclado.js      mapa de teclas
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
