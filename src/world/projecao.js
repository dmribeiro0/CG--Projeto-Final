/* Projeção perspectiva

Não é uma entidade (não coloca nada na cena) e não escuta o teclado:
    as teclas estao em teclado.js (aumentarFov, diminuirFov, resetarFov) e são ligadas
    às funções abaixo no main.js, no bloco "Controles":
  aoPressionar('aumentarFov', () => fov.aumentar()); */

export const FOV_MIN = 30;
export const FOV_MAX = 120;
export const FOV_PASSO = 5;

/* obterCameras: função que devolve o array com TODAS as câmeras
o FOV muda em todas as cameras perspectivas, entao continua igual ao alternar entre elas.
aoMudar(fov): opcional, chamado a cada mudança (e uma vez no inicio); serve para o HUD */

export function createControleFov(obterCameras, aoMudar) {
	const perspectivas = () => obterCameras().filter(cam => cam.isPerspectiveCamera);
	const fovInicial = perspectivas()[0].fov;
	let fov = fovInicial;

	function aplicar(novo) {
		fov = Math.min(FOV_MAX, Math.max(FOV_MIN, novo));
		for (const cam of perspectivas()) {
			cam.fov = fov;
			cam.updateProjectionMatrix(); // recalcula a matriz de projecao com o novo FOV
		}
		if (aoMudar) aoMudar(fov);
	}

	if (aoMudar) aoMudar(fov);

	return {
		get fov() { return fov; }, // FOV atual, para o HUD
		aumentar() { aplicar(fov + FOV_PASSO); },
		diminuir() { aplicar(fov - FOV_PASSO); },
		resetar()  { aplicar(fovInicial); }
	};
}