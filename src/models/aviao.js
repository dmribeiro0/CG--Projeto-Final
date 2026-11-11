import * as THREE from 'three';
import { carregaTextura } from '../textura.js';

/**
 * Avião animado.
 * Convenções: Y para cima, frente em -Z, origem no centro, 1 unidade = 1 m.
 * Animações: hélice girando, balanço (roll), arfagem (pitch) e flutuação suave.
 *
 * Textura: chapas de metal com frestas e rebites (aviao_metal.jpg + aviao_metal_normal.jpg),
 * gerada por código (Python/NumPy), sem fonte externa. Uma repetição = 2 m x 2 m do avião.
 */

const TELHA = 2; // metros cobertos por uma repetição da imagem

// Escala as UVs de um cilindro/cone pelas medidas reais: u vai em volta (circunferência),
// v ao longo do comprimento. Assim as chapas ficam do mesmo tamanho em qualquer peça.
function uvRevolucao(geo, circunferencia, comprimento) {
  const uv = geo.attributes.uv;
  for (let k = 0; k < uv.count; k++) {
    uv.setXY(k, uv.getX(k) * circunferencia / TELHA, uv.getY(k) * comprimento / TELHA);
  }
}

// Escala as UVs de uma caixa (w x h x d) face a face.
// Ordem das faces no BoxGeometry: +x, -x, +y, -y, +z, -z (4 vértices cada).
function uvCaixa(geo, w, h, d) {
  const uv = geo.attributes.uv;
  for (let k = 0; k < uv.count; k++) {
    const face = Math.floor(k / 4);
    const [su, sv] = face < 2 ? [d, h] : face < 4 ? [w, d] : [w, h];
    uv.setXY(k, uv.getX(k) * su / TELHA, uv.getY(k) * sv / TELHA);
  }
}

export function createAviao() {
  // `object` é o grupo que o main.js pode posicionar/mover livremente.
  // `corpo` é o grupo interno que recebe as animações de balanço.
  const object = new THREE.Group();
  const corpo = new THREE.Group();
  object.add(corpo);

  // ---------- Materiais ----------
  // A textura é cinza: `color` multiplica a imagem e dá a tinta (cinza-azulado ou vermelho).
  // Mesmo `repetir` (padrão) nos dois mapas, senão o relevo sai desalinhado da cor.
  const metal = carregaTextura('aviao_metal.jpg');
  const metalRelevo = carregaTextura('aviao_metal_normal.jpg', { cor: false });

  const matCorpo = new THREE.MeshPhongMaterial({ map: metal, normalMap: metalRelevo, color: 0xd9dde3, shininess: 80 });
  const matAsa = new THREE.MeshPhongMaterial({ map: metal, normalMap: metalRelevo, color: 0xc0392b, shininess: 50 });
  const matVidro = new THREE.MeshPhongMaterial({
    color: 0x66ccff,
    shininess: 120,
    transparent: true,
    opacity: 0.75,
  });
  const matHelice = new THREE.MeshPhongMaterial({ color: 0x2c2c2c });

  // ---------- Fuselagem (cilindro deitado no eixo Z, frente em -Z) ----------
  const fuselagemGeo = new THREE.CylinderGeometry(0.5, 0.22, 4, 20);
  fuselagemGeo.rotateX(-Math.PI / 2);
  uvRevolucao(fuselagemGeo, Math.PI * 0.72, 4); // circunferência média ~2,3 m, 4 m de comprimento
  const fuselagem = new THREE.Mesh(fuselagemGeo, matCorpo);
  corpo.add(fuselagem);

  // ---------- Nariz ----------
  const narizGeo = new THREE.ConeGeometry(0.5, 1, 20);
  narizGeo.rotateX(-Math.PI / 2);
  uvRevolucao(narizGeo, Math.PI * 1.0, 1.118); // base de 3,14 m, geratriz de 1,118 m
  const nariz = new THREE.Mesh(narizGeo, matAsa);
  nariz.position.z = -2.5;
  corpo.add(nariz);

  // ---------- Cabine ----------
  const cabine = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), matVidro);
  cabine.scale.set(0.9, 0.8, 1.6);
  cabine.position.set(0, 0.4, -0.5);
  corpo.add(cabine);

  // ---------- Âncora do cockpit (câmera de 1ª pessoa) ----------
  // Atrás e acima da cabine, para a vista mostrar as asas; em z maior a câmera
  // entra na deriva da cauda. No `corpo`, para herdar o balanço do avião.
  const cockpit = new THREE.Object3D();
  cockpit.position.set(0, 1.0, 1.3);
  corpo.add(cockpit);

  // ---------- Asas ----------
  const asasGeo = new THREE.BoxGeometry(7, 0.1, 1.3);
  uvCaixa(asasGeo, 7, 0.1, 1.3);
  const asas = new THREE.Mesh(asasGeo, matAsa);
  asas.position.set(0, -0.1, -0.2);
  corpo.add(asas);

  // ---------- Cauda ----------
  const estabHorizGeo = new THREE.BoxGeometry(2.4, 0.08, 0.7);
  uvCaixa(estabHorizGeo, 2.4, 0.08, 0.7);
  const estabHoriz = new THREE.Mesh(estabHorizGeo, matAsa);
  estabHoriz.position.set(0, 0, 1.8);
  corpo.add(estabHoriz);

  const estabVertGeo = new THREE.BoxGeometry(0.08, 0.9, 0.8);
  uvCaixa(estabVertGeo, 0.08, 0.9, 0.8);
  const estabVert = new THREE.Mesh(estabVertGeo, matAsa);
  estabVert.position.set(0, 0.45, 1.8);
  corpo.add(estabVert);

  // ---------- Hélice (gira em torno do eixo Z) ----------
  const helice = new THREE.Group();
  const pa = new THREE.BoxGeometry(1.8, 0.14, 0.04);
  const pa1 = new THREE.Mesh(pa, matHelice);
  const pa2 = new THREE.Mesh(pa, matHelice);
  pa2.rotation.z = Math.PI / 2;
  helice.add(pa1, pa2);

  const cubo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), matHelice);
  helice.add(cubo);
  helice.position.z = -3.05;
  corpo.add(helice);

  // ---------- Âncoras e luzes ----------
  // Âncora: ponto vazio do modelo; a luz presa nela acompanha o avião (ver README).
  const ancoraFarol = new THREE.Object3D();
  ancoraFarol.position.set(0, 0.62, -1.7);   // em cima do nariz, na frente da cabine
  corpo.add(ancoraFarol);

  const ancoraAsaEsq = new THREE.Object3D();
  ancoraAsaEsq.position.set(-3.5, 0.05, -0.2); // ponta da asa esquerda
  corpo.add(ancoraAsaEsq);

  const ancoraAsaDir = new THREE.Object3D();
  ancoraAsaDir.position.set(3.5, 0.05, -0.2);  // ponta da asa direita
  corpo.add(ancoraAsaDir);

  // Farol: SpotLight (cone). Parâmetros: cor, intensidade, alcance, ângulo, penumbra, decay.
  // decay 1 (atenuação suave) para o feixe ainda iluminar o que está a dezenas de metros.
  const farol = new THREE.SpotLight(0xfff1cc, 90, 150, Math.PI / 6, 0.5, 1);
  ancoraFarol.add(farol);
  const alvoFarol = new THREE.Object3D();    // para onde o cone aponta (frente, um pouco para baixo)
  alvoFarol.position.set(0, -0.8, -10);
  ancoraFarol.add(alvoFarol);
  farol.target = alvoFarol;

  // Luzes de navegação: PointLight, vermelha na esquerda e verde na direita (como nos aviões reais).
  const navEsq = new THREE.PointLight(0xff2020, 3, 8, 2);
  const navDir = new THREE.PointLight(0x20ff40, 3, 8, 2);
  ancoraAsaEsq.add(navEsq);
  ancoraAsaDir.add(navDir);

  // Lâmpadas visíveis: emissive porque essas peças emitem luz de verdade.
  // O brilho é desligado junto com a luz (ver update).
  const lampadaGeo = new THREE.SphereGeometry(0.12, 12, 8);
  const matLampFarol = new THREE.MeshPhongMaterial({ color: 0x555544, emissive: 0xfff1cc });
  const matLampEsq = new THREE.MeshPhongMaterial({ color: 0x440000, emissive: 0xff2020 });
  const matLampDir = new THREE.MeshPhongMaterial({ color: 0x004410, emissive: 0x20ff40 });
  ancoraFarol.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), matLampFarol));
  ancoraAsaEsq.add(new THREE.Mesh(lampadaGeo, matLampEsq));
  ancoraAsaDir.add(new THREE.Mesh(lampadaGeo, matLampDir));

  // ---------- Animação ----------
  let t = 0;

  function update(dt) {
    t += dt;

    // lâmpada acesa só enquanto a luz correspondente está ligada
    matLampFarol.emissiveIntensity = farol.intensity > 0 ? 1 : 0;
    matLampEsq.emissiveIntensity = navEsq.intensity > 0 ? 1 : 0;
    matLampDir.emissiveIntensity = navDir.intensity > 0 ? 1 : 0;

    // hélice girando rápido
    helice.rotation.z += 30 * dt;

    // balanço lateral, arfagem leve e flutuação vertical
    corpo.rotation.z = Math.sin(t * 1.2) * 0.25; // roll
    corpo.rotation.x = Math.sin(t * 1.7) * 0.05; // pitch
    corpo.position.y = Math.sin(t * 2.0) * 0.15; // sobe e desce
  }


  return {
    object,
    update,
    ancoras: { cockpit, farol: ancoraFarol, asaEsq: ancoraAsaEsq, asaDir: ancoraAsaDir },
    luzes: { farol, navEsq, navDir },
  };

}
