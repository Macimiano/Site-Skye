/*
Edite somente os valores abaixo para reutilizar a demonstração em outra apresentação.
Não coloque dados reais ou sigilosos neste arquivo, pois ele fica público na hospedagem.
*/
window.SKYE_DEMO_CONFIG = {
  companyName: "Açaiteria Modelo",
  businessLabel: "DEMONSTRAÇÃO DE AÇAITERIA",
  city: "Cidade Modelo",
  address: "Avenida Exemplo, 120, Centro, Cidade Modelo/SP",
  storageKey: "skye.demo.acaiteria-modelo.v1",
  colors: {
    primary: "#183044",
    primaryDark: "#102330",
    accent: "#d9b86c"
  }
};

(() => {
  const colors = window.SKYE_DEMO_CONFIG.colors || {};
  const root = document.documentElement;
  if (colors.primary) root.style.setProperty("--purple", colors.primary);
  if (colors.primaryDark) root.style.setProperty("--purple-dark", colors.primaryDark);
  if (colors.accent) root.style.setProperty("--green", colors.accent);
})();
