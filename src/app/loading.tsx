export default function Loading() {
  return (
    <div
      className="flex h-screen items-center justify-center bg-[#eef5fe]"
      role="status"
      aria-label="Carregando"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#b9d4f0] border-t-[#f5920b]" />
    </div>
  )
}
