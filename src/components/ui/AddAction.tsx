import { PlusSignIcon } from "hugeicons-react";
import { MOBILE_QUERY, useMediaQuery } from "../../hooks/useMediaQuery";
import { cn } from "../../utils/cn";
import Fab from "./Fab";

interface AddActionProps {
    label: string;
    onClick: () => void;
    className?: string;
}

/**
 * Ação primária de "adicionar" de uma página: botão na toolbar no desktop e
 * ilha redonda fixa (Fab) no celular, onde o botão ficava perdido no meio do
 * cabeçalho. Um único ponto para todas as páginas com criação (Pedidos, Cores,
 * Materiais, Agenda, Ordens de Pintura).
 */
function AddAction({ label, onClick, className }: AddActionProps) {
    const mobile = useMediaQuery(MOBILE_QUERY);

    if (mobile) {
        return (
            <Fab label={label} onClick={onClick}>
                <PlusSignIcon size={24} strokeWidth={2.25} />
            </Fab>
        );
    }

    return (
        <button type="button" className={cn("button btn-novo-pedido", className)} onClick={onClick}>
            <PlusSignIcon size={16} strokeWidth={2.25} />
            {label}
        </button>
    );
}

export default AddAction;
