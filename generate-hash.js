const bcrypt = require("bcryptjs");

async function generateHash() {
  const password = "123456789";
  const hash = await bcrypt.hash(password, 10);
  console.log("Password:", password);
  console.log("Hash:", hash);
  
  // Verificar que el hash es correcto
  const isValid = await bcrypt.compare(password, hash);
  console.log("Verification:", isValid);
}

generateHash();
