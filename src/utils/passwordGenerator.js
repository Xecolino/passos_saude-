/**
 * Utilitários para Geração de Senha Aleatória e Template de E-mail de Boas-Vindas
 */

/**
 * Gera aleatoriamente uma senha com tamanho entre minLength e maxLength (padrão 6 a 8 caracteres)
 * combinando letras maiúsculas, minúsculas, números e caracteres especiais.
 * @param {number} minLength - Mínimo de caracteres (padrão: 6)
 * @param {number} maxLength - Máximo de caracteres (padrão: 8)
 * @returns {string} Senha aleatória gerada
 */
export function generateRandomPassword(minLength = 6, maxLength = 8) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';

  // Sorteia tamanho entre minLength e maxLength (ex: 6, 7 ou 8)
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

  // Garante ao menos 1 de cada categoria essencial
  let result = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];

  const allChars = upper + lower + numbers + symbols;

  // Preenche o restante até atingir o comprimento sorteado
  while (result.length < length) {
    result.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Embaralha aleatoriamente (algoritmo Fisher-Yates)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

/**
 * Cria o conteúdo textual do e-mail de boas-vindas com todas as diretrizes solicitadas
 * @param {Object} params - { name, email, password }
 * @returns {Object} { subject, textBody, htmlGreeting }
 */
export function buildWelcomeEmail({ name, email, password }) {
  const formattedName = (name || 'Colaborador(a)').trim();
  const subject = `🎉 Seja bem vindo ao Passo Saúde ${formattedName}! Suas credenciais de acesso`;

  const textBody = `Seja bem vindo ao Passo Saúde ${formattedName}!

É uma alegria imensa ter você conosco nessa jornada rumo a uma rotina de trabalho mais ativa, saudável e recompensadora!

🌟 Sobre o Passo é Saúde:
O Passo é Saúde é a plataforma corporativa de bem-estar e gestão ocupacional da nossa empresa. Nosso propósito é transformar pequenos hábitos diários em grandes conquistas para sua saúde física e mental:
• 🚶 Movimento & Metas: Monitore seus passos e combata o sedentarismo de forma leve e prática;
• 🪙 Moedas PassoCoins: Suas caminhadas e hábitos saudáveis rendem moedas que podem ser trocadas na loja por folgas remuneradas (Day Off), vouchers e brindes especiais;
• 🧘 Pausas Anti-Estresse: Acesse meditações guiadas e pausas ativas para alívio de fadiga e prevenção de burnout;
• 🛡️ Escuta Segura & NR-1: Suporte psicológico dedicado e um canal acolhedor com sigilo total.

🔑 Suas Credenciais de Acesso:
E-mail: ${email}
Senha temporária: ${password}

⚠️ Aconselhamos fortemente que você altere esta senha temporária no seu primeiro acesso ao aplicativo, acessando a aba "Meu Perfil", garantindo a privacidade e segurança total da sua conta.

Baixe o app ou acesse no seu navegador e comece a caminhar rumo à sua melhor versão!

Com carinho,
Equipe de Recursos Humanos, Saúde & SST — Passo é Saúde`;

  return {
    subject,
    textBody,
    greeting: `Seja bem vindo ao Passo Saúde ${formattedName}`
  };
}
