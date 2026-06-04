/**
 * Traduz mensagens técnicas vindas do backend/Supabase para algo
 * que o usuário final consiga entender e agir.
 * Reusado em AceitarConvite, EsqueciSenha e RedefinirSenha.
 */
export function friendlyAuthError(raw: string): { title: string; description: string } {
  const msg = (raw || "").toLowerCase();

  if (
    msg.includes("pwned") ||
    msg.includes("known to be weak") ||
    msg.includes("compromised") ||
    msg.includes("data breach") ||
    msg.includes("hibp") ||
    msg.includes("leaked")
  ) {
    return {
      title: "Senha muito comum",
      description:
        "Esta senha apareceu em vazamentos públicos e não é segura. Crie uma senha única, combinando letras maiúsculas, minúsculas, números e símbolos.",
    };
  }
  if (
    msg.includes("password should be at least") ||
    msg.includes("password is too short") ||
    msg.includes("min length") ||
    msg.includes("at least 8")
  ) {
    return { title: "Senha muito curta", description: "Use ao menos 8 caracteres com letras, números e símbolos." };
  }
  if (msg.includes("weak password") || msg.includes("password is too weak")) {
    return { title: "Senha fraca", description: "Inclua letras maiúsculas, minúsculas, números e símbolos." };
  }
  if (
    msg.includes("already been registered") ||
    msg.includes("user already registered") ||
    msg.includes("email_exists") ||
    msg.includes("already exists")
  ) {
    return {
      title: "E-mail já cadastrado",
      description: "Já existe uma conta com este e-mail. Acesse pela tela de login ou recupere sua senha.",
    };
  }
  if (msg.includes("invalid email") || msg.includes("email address") && msg.includes("invalid")) {
    return { title: "E-mail inválido", description: "Confira o endereço digitado e tente novamente." };
  }
  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("over_email_send_rate_limit")) {
    return { title: "Muitas tentativas", description: "Aguarde alguns instantes antes de tentar novamente." };
  }
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("non-2xx")) {
    return { title: "Falha de conexão", description: "Não conseguimos falar com o servidor. Verifique sua internet e tente novamente." };
  }
  if (msg.includes("expired") || msg.includes("token has expired")) {
    return {
      title: "Link expirado",
      description: "Este link já passou da validade. Solicite um novo para continuar.",
    };
  }
  if (msg.includes("invalid token") || msg.includes("invalid_token") || msg.includes("token is invalid")) {
    return { title: "Link inválido", description: "Este link não é mais válido. Solicite um novo." };
  }
  if (msg.includes("session") && (msg.includes("expired") || msg.includes("missing"))) {
    return { title: "Sessão expirada", description: "Abra o link de redefinição novamente para continuar." };
  }
  return { title: "Não foi possível concluir", description: raw || "Tente novamente em instantes." };
}