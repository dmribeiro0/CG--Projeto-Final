/* Projeção perspectiva - demonstração do efeito (segue o contrato de entidade, ver models/cubo.js)
    Teclas + e - mudam o FOV em tempo real; 0 volta ao FOV inicial.
 */

export const FOV_MIN = 30;
export const FOV_MAX = 120;
export const FOV_PASSO = 5;

/* cameras: array com as cameras perspectivas (o FOV muda em todas, entao continua igual ao alternar)
 * aoMudar(fov): opcional, chamado a cada mudanca (e uma vez no inicio); serve para o HUD */
export function ativarControleFov(cameras, aoMudar) {
    const perspectivas = () => cameras.filter(cam => cam.isPerspectiveCamera);
    const fovInicial = perspectivas()[0].fov;
    let fov = fovInicial;

    function aplicar(novo) {
        fov = Math.min(FOV_MAX, Math.max(FOV_MIN, novo));
        for (const cam of perspectivas()) {
            cam.fov = fov;
            cam.updateProjectionMatrix(); // recalcula a matriz de projeção com o novo FOV
        }
        if (aoMudar) aoMudar(fov);
    }

    window.addEventListener('keydown', (evento) => {
        if (evento.key === '+' || evento.key === '=') aplicar(fov + FOV_PASSO);
        else if (evento.key === '-' || evento.key === '_') aplicar(fov - FOV_PASSO);
        else if (evento.key === '0') aplicar(fovInicial);
    });

    if (aoMudar) aoMudar(fov);
}
