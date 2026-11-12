/* Tecla R: liga/desliga o normalMap dos materiais da cena.
 * Criar depois das entidades. */

/* Materiais da cena, sem repetir */
function materiaisDaCena(scene) {
	const materiais = new Set();
	scene.traverse((objeto) => {
		if (!objeto.material) return;
		for (const material of [objeto.material].flat()) materiais.add(material);
	});
	return materiais;
}

function definirRelevo(material, ligar) {
	if (ligar) {
		material.normalMap = material.userData.normalMap;
	} else {
		material.userData.normalMap = material.normalMap;	/* guarda antes de tirar */
		material.normalMap = null;
	}
	material.needsUpdate = true;	/* recompila o shader */
}

export function createRelevo(scene) {
	const comRelevo = [...materiaisDaCena(scene)].filter((material) => material.normalMap);
	let ligado = true;

	return {
		get ligado() { return ligado; },

		alternar() {
			ligado = !ligado;
			for (const material of comRelevo) definirRelevo(material, ligado);
		}
	};
}
