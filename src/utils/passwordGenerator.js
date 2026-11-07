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
 * Cria o conteúdo textual do e-mail de boas-vindas com todas as diretrizes solicitadas:
 *   - Texto de bem-vindo com o nome do usuário
 *   - A senha provisória
 *   - O link para entrar no app
 * @param {Object} params - { name, email, password, companyName, papel, appUrl }
 * @returns {Object} { subject, textBody, greeting, appUrl }
 */
export function buildWelcomeEmail({ name, email, password, companyName = '', papel = '', appUrl = '' }) {
  const formattedName = (name || 'Usuário(a)').trim();
  const resolvedUrl =
    appUrl ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://passos-saude.vercel.app');

  const roleNotice =
    papel === 'rh_admin'
      ? `\n🏢 Perfil atribuído: Gestor RH Administrador (${companyName || 'Empresa'})\nVocê foi designado(a) como responsável pela gestão da sua empresa na plataforma Passo é Saúde.`
      : companyName
      ? `\n🏢 Empresa vinculada: ${companyName}`
      : '';

  const subject = `🎉 Seja bem-vindo(a) ao Passo é Saúde, ${formattedName}! Suas credenciais de acesso`;

  const textBody = `Seja bem-vindo(a) ao Passo é Saúde, ${formattedName}!

É uma alegria ter você conosco na plataforma corporativa de bem-estar, gamificação e conformidade NR-1!${roleNotice}

🔑 Suas Credenciais de Primeiro Acesso:
• E-mail: ${email}
• Senha provisória: ${password}

🔗 Link para entrar no App:
${resolvedUrl}

📋 Importante no seu Primeiro Acesso:
1. Acesse o link acima (${resolvedUrl}) e informe seu e-mail e a senha provisória;
2. Na tela inicial, leia o "Termo de Responsabilidade" e clique no botão "Aceite" para ativar o seu cadastro (sua situação mudará automaticamente de "convidado" para "ativo");
3. Por segurança, recomendamos alterar sua senha provisória na aba "Meu Perfil".

Atenciosamente,
Equipe Passo é Saúde — Bem-Estar, Gamificação & Conformidade Ocupacional`;

  return {
    subject,
    textBody,
    greeting: `Seja bem-vindo(a) ao Passo é Saúde, ${formattedName}`,
    appUrl: resolvedUrl
  };
}
