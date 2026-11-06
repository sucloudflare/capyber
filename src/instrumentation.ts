// CAPYBER — instrumentation hook do Next.js
// Sobe o motor CAPYCORE (socket.io + REST na porta 3003) DENTRO do processo
// do servidor. Assim o motor vive enquanto o app viver — sem processo extra.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCapyCore } = await import('./server/capycore')
    startCapyCore()
  }
}
