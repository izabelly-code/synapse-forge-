import { Cancel01Icon } from "hugeicons-react";
import { useEscapeKey } from "../../hooks/useEscapeKey";

interface ImageLightboxProps {
    src: string;
    alt?: string;
    onClose: () => void;
}

function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
    useEscapeKey(
        (event) => {
            event.stopImmediatePropagation();
            onClose();
        },
        { capture: true },
    );

    return (
        <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <button type="button" className="lightbox-close" onClick={onClose} aria-label="Fechar">
                <Cancel01Icon size={22} />
            </button>
            <img
                className="lightbox-img"
                src={src}
                alt={alt ?? ""}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

export default ImageLightbox;
