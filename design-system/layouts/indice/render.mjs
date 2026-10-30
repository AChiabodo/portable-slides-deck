export default function render({ zone }) {
  return `${zone.titolo}<ol class="indice-voci">${zone.voci}</ol>`;
}
