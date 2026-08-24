import { useEffect } from "react";
import { Cancel01Icon } from "hugeicons-react";

interface ImageLightboxProps {
    src: string;
    alt?: string;
    onClose: () => void;
}

function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.stopImmediatePropagation();
                onClose();
            }
        }
        document.addEventListener("keydown", onKey, true);
        return () => document.removeEventListener("keydown", onKey, true);
    }, [onClose]);

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
