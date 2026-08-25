# Logotipos de la vista /info

Coloca aquí los dos archivos, **con estos nombres exactos**:

| Archivo | Organización |
|---|---|
| `consorcio-ciudad-loja.png` | Consorcio Ciudad de Loja |
| `mecdevs.png` | MEC Devs |

Se aceptan `.png`, `.jpg`, `.jpeg`, `.svg` y `.webp` — solo importa el nombre
base del archivo, no la extensión.

`Info.jsx` los descubre con `import.meta.glob`, así que **no hay ningún import
estático que rompa la compilación mientras falten**. Mientras no estén, la vista
muestra un recuadro discreto con el nombre de la organización; en cuanto se
dejen aquí, el siguiente `pnpm run build` los toma automáticamente.

Los logos se muestran con `object-contain` sobre fondo claro (para los que
tengan transparencia) y no son interactivos: no son enlaces ni tienen eventos de
clic, porque la pantalla opera en modo kiosco.
