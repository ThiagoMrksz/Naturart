const bcrypt = require('bcrypt');
const db = require('./src/config/db');

(async () => {
  try {
    // Buscar o usuário no banco
    const [users] = await db.execute(
      'SELECT email, senha_hash FROM usuarios WHERE email = ?',
      ['juadm@email.com']
    );
    
    if (users.length === 0) {
      console.log('❌ Usuário não encontrado');
      process.exit(1);
    }
    
    const user = users[0];
    const senhaDigitada = '282610';
    
    console.log('📋 Testando autenticação:');
    console.log('Email:', user.email);
    console.log('Hash no banco:', user.senha_hash);
    console.log('Senha testada:', senhaDigitada);
    
    // Testar bcrypt
    const senhaValida = await bcrypt.compare(senhaDigitada, user.senha_hash);
    
    console.log('\n✅ Resultado: Senha é válida?', senhaValida);
    
    if (!senhaValida) {
      console.log('❌ A senha NÃO corresponde ao hash!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  process.exit(0);
})();
