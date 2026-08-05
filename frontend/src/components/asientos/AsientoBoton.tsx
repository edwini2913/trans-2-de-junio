import { Armchair } from "lucide-react";

import type { Asiento } from "./asiento.types";

interface Props {

    asiento: Asiento;

    seleccionado: boolean;

    onClick: () => void;

}

export default function AsientoBoton({

    asiento,

    seleccionado,

    onClick,

}: Props) {

    const ocupado =
        asiento.estado !== "DISPONIBLE";

    return (

        <button

            disabled={ocupado}

            onClick={onClick}

            className={`

            w-16

            h-16

            rounded-2xl

            border-2

            flex

            flex-col

            justify-center

            items-center

            transition-all

            duration-300

            font-black

            ${ocupado

                    ? "bg-red-500/20 border-red-500 text-red-400 cursor-not-allowed"

                    : seleccionado

                        ? "bg-yellow-400 border-yellow-400 text-slate-950 scale-110"

                        : "bg-emerald-500/10 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white"

                }

        `}

        >

            <Armchair size={20} />

            <span>

                {asiento.numero}

            </span>

        </button>

    );

}