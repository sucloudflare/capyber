export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eef5fe] px-6 text-center">
      <p className="font-mono text-sm font-bold tracking-[0.3em] text-[#c0182b]">404</p>
      <h1 className="text-2xl font-extrabold text-[#10315c]">Endpoint não encontrado</h1>
      <a
        href="/"
        className="rounded-xl bg-[#f5920b] px-5 py-2.5 font-bold text-white shadow-lg transition hover:brightness-105"
      >
        Voltar ao centro de comando
      </a>
    </main>
  )
}
