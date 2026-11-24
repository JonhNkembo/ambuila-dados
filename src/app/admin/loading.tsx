/** Mostrado enquanto uma página do painel carrega: barra no topo + esqueleto dos cartões. */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="loading-bar no-print" />
      <div className="row g-3 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="col-6 col-sm-4 col-xl-2" key={i}><div className="skeleton" style={{ height: 96 }} /></div>
        ))}
      </div>
      <div className="row g-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div className="col-lg-6" key={i}><div className="skeleton" style={{ height: 280 }} /></div>
        ))}
      </div>
    </div>
  );
}
