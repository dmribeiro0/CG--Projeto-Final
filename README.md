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
├── main.js         cena, câmera, renderer e loop
├── models/         personagens (avião, inimigos)
└── world/          cenário e luzes
```

## Como adicionar uma entidade

1. Criar o arquivo em `src/models/` (personagem) ou `src/world/` (cenário), usando `src/models/cubo.js` como referência.
2. Exportar uma função `createX()` que retorna `{ object, update(dt) }`:
   - `object`: `THREE.Object3D` adicionado na cena (`Mesh` ou `Group`);
   - `update(dt)`: chamada a cada frame; `dt` = segundos desde o frame anterior.
3. Seguir as convenções: Y para cima, frente em −Z, origem no centro do modelo, 1 unidade = 1 m, `MeshPhongMaterial`.
4. Importar em `src/main.js`, no bloco `/* Importar aqui cada entidade */`.
5. Chamar `adicionar(createX())` no bloco `/* Inserir aqui as entidades */`.

## Fluxo de Git

Uma branch por tarefa (ex.: `feat/aviao`), com pull request para a `main`.
