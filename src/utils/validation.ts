export const PASSWORD_REQUIREMENTS_MESSAGE =
  "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula e um número.";

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getPasswordValidationMessage(password: string) {
  if (!password) {
    return "Informe sua senha.";
  }

  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  return "";
}
