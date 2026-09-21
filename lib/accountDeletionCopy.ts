/** New deletion-status copy. Existing catalogs remain intact; unsupported locales use English. */
const en = {
  title: 'Delete account',
  unavailable: 'Account deletion cannot be started in this version.',
  unchanged: 'This screen has not sent a deletion request or changed your account or subscriptions.',
  settings: 'Back to Settings',
  signIn: 'Sign in',
  guest: 'Sign in to view your account settings.',
  loading: 'Loading account settings…',
  close: 'Close',
};
type Copy = typeof en;
const translations: Record<string, Copy> = {
  en,
  pt: {
    title: 'Excluir conta',
    unavailable: 'Não é possível iniciar a exclusão da conta nesta versão.',
    unchanged: 'Esta tela não enviou uma solicitação de exclusão nem alterou sua conta ou assinaturas.',
    settings: 'Voltar às Configurações',
    signIn: 'Entrar',
    guest: 'Entre para ver as configurações da sua conta.',
    loading: 'Carregando configurações da conta…',
    close: 'Fechar',
  },
  es: {
    title: 'Eliminar cuenta',
    unavailable: 'No se puede iniciar la eliminación de la cuenta en esta versión.',
    unchanged: 'Esta pantalla no ha enviado una solicitud de eliminación ni ha cambiado tu cuenta o suscripciones.',
    settings: 'Volver a Configuración',
    signIn: 'Iniciar sesión',
    guest: 'Inicia sesión para ver la configuración de tu cuenta.',
    loading: 'Cargando configuración de la cuenta…',
    close: 'Cerrar',
  },
};
export function accountDeletionCopy(locale?: string): Copy {
  return translations[(locale || 'en').toLowerCase().split(/[-_]/)[0]] || en;
}
