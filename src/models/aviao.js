import * as THREE from 'three';

/**
 * Avião animado.
 * Convenções: Y para cima, frente em -Z, origem no centro, 1 unidade = 1 m.
 * Animações: hélice girando, balanço (roll), arfagem (pitch) e flutuação suave.
 */
export function createAviao() {
  // `object` é o grupo que o main.js pode posicionar/mover livremente.
  // `corpo` é o grupo interno que recebe as animações de balanço.
  const object = new THREE.Group();
  const corpo = new THREE.Group();
  object.add(corpo);

  // ---------- Materiais ----------
  const matCorpo = new THREE.MeshPhongMaterial({ color: 0xd9dde3, shininess: 80 });
  const matAsa = new THREE.MeshPhongMaterial({ color: 0xc0392b, shininess: 50 });
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
  const fuselagem = new THREE.Mesh(fuselagemGeo, matCorpo);
  corpo.add(fuselagem);

  // ---------- Nariz ----------
  const narizGeo = new THREE.ConeGeometry(0.5, 1, 20);
  narizGeo.rotateX(-Math.PI / 2);
  const nariz = new THREE.Mesh(narizGeo, matAsa);
  nariz.position.z = -2.5;
  corpo.add(nariz);

  // ---------- Cabine ----------
  const cabine = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), matVidro);
  cabine.scale.set(0.9, 0.8, 1.6);
  cabine.position.set(0, 0.4, -0.5);
  corpo.add(cabine);

  // ---------- Asas ----------
  const asas = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 1.3), matAsa);
  asas.position.set(0, -0.1, -0.2);
  corpo.add(asas);

  // ---------- Cauda ----------
  const estabHoriz = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.7), matAsa);
  estabHoriz.position.set(0, 0, 1.8);
  corpo.add(estabHoriz);

  const estabVert = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.8), matAsa);
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

  // ---------- Animação ----------
  let t = 0;

  function update(dt) {
    t += dt;

    // hélice girando rápido
    helice.rotation.z += 30 * dt;

    // balanço lateral, arfagem leve e flutuação vertical
    corpo.rotation.z = Math.sin(t * 1.2) * 0.25; // roll
    corpo.rotation.x = Math.sin(t * 1.7) * 0.05; // pitch
    corpo.position.y = Math.sin(t * 2.0) * 0.15; // sobe e desce
  }

  return { object, update };
}
