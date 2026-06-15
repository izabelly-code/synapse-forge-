import { useState } from "react";
import OrcamentoCalculator from "./OrcamentoCalculator";
import OrcamentoHistorico from "./OrcamentoHistorico";

function OrcamentoPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    return (
        <main className="dashboard-main orcamento-page">
            <OrcamentoCalculator onSalvo={() => setRefreshKey((k) => k + 1)} />
            <OrcamentoHistorico key={refreshKey} />
        </main>
    );
}

export default OrcamentoPage;
