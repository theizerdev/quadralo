const fs = require("fs");
const path = require("path");

const src = path.normalize("C:/Users/Theizer/.gemini/antigravity-ide/brain/5218d169-bd70-4247-acc6-627687c8bfb1/emprendedor_cuadrando_cuentas_1788646052833.jpg");
const dst = path.join(__dirname, "public", "login_hero.jpg");

try {
  fs.copyFileSync(src, dst);
  console.log("Imagen copiada exitosamente a public/login_hero.jpg");
} catch (err) {
  console.error("Error al copiar imagen:", err);
}
