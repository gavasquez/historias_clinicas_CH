const bcrypt = require("bcryptjs");

async function generateHash() {
  const password = process.argv[2] || process.env.PASSWORD_TO_HASH;

  if (!password) {
    console.error("Uso: node generate-hash.js <contraseña>");
    console.error("O define la variable de entorno PASSWORD_TO_HASH");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  console.log("Hash:", hash);

  // Verificar que el hash es correcto
  const isValid = await bcrypt.compare(password, hash);
  console.log("Verificación:", isValid);
}

generateHash();
