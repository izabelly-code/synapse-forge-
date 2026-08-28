/**
 * Escolhe a paleta de gradiente do avatar por hash do usuário/cliente:
 * determinístico (a mesma pessoa vê sempre a mesma cor), variado entre pessoas.
 * As paletas vivem em .avatar-grad-0..5 no index.css.
 */
export function avatarPalette(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return `avatar-grad-${h % 6}`;
}
