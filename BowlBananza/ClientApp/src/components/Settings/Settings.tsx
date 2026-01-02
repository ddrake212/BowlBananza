import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import Cropper, { Area } from "react-easy-crop";
import styles from "./Styles/Settings.module.css";
import MainLoading from "../MainLoading";
import { compressImageUnder2MB } from "../../utils/imageUtils";
import { useNavigate } from "react-router";
import { ColorContext } from "../../contexts/ColorContext";

type PreferencesProps = {
    initialColor?: string;
    initialImageBase64?: string; // cropped
    initialOriginalImageBase64?: string; // raw/original
    onChange?: (prefs: {
        color: string;
        imageBase64: string | null;
        originalImageBase64: string | null;
    }) => void;
};

export default function Settings({
    initialColor = "#0a0f17eb",
    initialImageBase64 = "",
    initialOriginalImageBase64 = "",
    onChange,
}: PreferencesProps) {
    const navigate = useNavigate();
    const [color, setColor] = useState(initialColor);

    const { setColor: setColorMain } = React.useContext(ColorContext) ?? { setColor: () => { } };

    useEffect(() => {
        setColorMain('#ffffff00');
        const glowColors = [
            "#00FFFF", // Cyan
            "#008CFF", // Electric Blue
            "#7A00FF", // Royal Purple
            "#FF00FF", // Magenta
            "#FF0099", // Hot Pink
            "#FF0033", // Neon Red
            "#FF7A00", // Amber Orange
            "#F8FF00", // Neon Yellow
            "#32FF00", // Lime Green
            "#00FF99", // Aqua Green
            "#ffffff00"
        ];
        const timeout = setInterval(() => {
            const c = glowColors.shift();
            glowColors.push(c ?? '');
            setColorMain(c ?? '');
        }, 5000);
        return () => clearInterval(timeout);
    }, [setColorMain]);

    // FINAL saved avatar (cropped)
    const [imageBase64, setImageBase64] = useState<string | null>(initialImageBase64 || null);

    // ORIGINAL uploaded image (persist this so re-cropping always starts from the true original)
    const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(
        initialOriginalImageBase64 || null
    );
    
    const [tempOriginalImageBase64, setTempOriginalImageBase64] = useState<string | null>(null);

    // Image currently being cropped (source fed into cropper)
    const [rawImageBase64, setRawImageBase64] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Cropper state
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [tempCrop, setTempCrop] = useState({ x: 0, y: 0 });
    const [tempZoom, setTempZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch("/api/settings/getData")
            .then((resp) => {
                if (resp.status === 401) {
                    navigate('/login', { state: { rtnPage: '/preferences' } });
                } else {
                    return resp.json();
                }
            })
            .then((result) => {
                // You said you’ll update backend/types — these are the new names:
                // result.ImageBase64 (cropped), { state: { rtnPage: '/history' } }
                // result.OriginalImageBase64 (raw)
                setImageBase64(result.ImageBase64 ?? null);
                setOriginalImageBase64(result.OriginalImageBase64 ?? null);
                setColor(result.Color ?? initialColor);
                setZoom(result.Zoom ?? 1);
                setCrop(result.Cropx || result.Cropy ? {x: result.Cropx, y: result.Cropy} : { x: 0, y:0 });
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialColor, navigate]);

    const previewSrc = useMemo(() => imageBase64 ?? "", [imageBase64]);

    const emitChange = useCallback(
        (next: { color: string; imageBase64: string | null; originalImageBase64: string | null }) => {
            onChange?.(next);
        },
        [onChange]
    );

    const fileToBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Failed to read file."));
            reader.readAsDataURL(file);
        });

    const startCroppingWithSource = (sourceBase64: string) => {
        setRawImageBase64(sourceBase64);
        setIsCropping(true);

        setCroppedAreaPixels(null);
        setError(null);
    };

    const handleFileSelected = useCallback(async (file: File | null) => {
        setError(null);
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (PNG, JPG, WEBP, etc.).");
            return;
        }

        const maxBytes = 2 * 2048 * 2048;
        if (file.size > maxBytes) {
            setError("That image is a bit large. Please use an image under 8MB.");
            return;
        }

        const fileSizeMax = 2 * 1024 * 1024; //2MB

        let _file = file;

        if (file.size > fileSizeMax) {
            _file = await compressImageUnder2MB(file);
        }

        try {
            const base64 = await fileToBase64(_file);

            // Persist the true original
            setTempOriginalImageBase64(base64);

            setTempZoom(zoom);
            setTempCrop(crop);
            setZoom(1);
            setCrop({ x: 0, y: 0 });

            // Immediately open cropper using the true original
            startCroppingWithSource(base64);
        } catch {
            setError("Could not process that image. Please try another one.");
        }
    }, [zoom, crop]);

    const startCropExisting = useCallback(() => {
        // Re-crop should always use the original image if we have it.
        setTempZoom(zoom);
        setTempCrop(crop);
        const source = originalImageBase64 ?? imageBase64;
        if (!source) return;
        startCroppingWithSource(source);
    }, [zoom, crop, originalImageBase64, imageBase64]);

    const clearImage = () => {
        setImageBase64(null);
        setOriginalImageBase64(null);
        setRawImageBase64(null);
        setIsCropping(false);
        setCroppedAreaPixels(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        emitChange({ color, imageBase64: null, originalImageBase64: null });
    };

    const onColorChange = (nextColor: string) => {
        setColor(nextColor);
        emitChange({ color: nextColor, imageBase64, originalImageBase64 });
    };

    const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const applyCrop = useCallback(async () => {
        if (!rawImageBase64 || !croppedAreaPixels) return;

        try {
            setOriginalImageBase64(tempOriginalImageBase64);
            const cropped = await getCroppedImageBase64(rawImageBase64, croppedAreaPixels, 256);

            setImageBase64(cropped);

            // Close cropper, keep originalImageBase64 as-is for future re-cropping
            setIsCropping(false);
            setRawImageBase64(null);
            setCroppedAreaPixels(null);

            emitChange({ color, imageBase64: cropped, originalImageBase64: tempOriginalImageBase64 });
        } catch {
            setError("Could not crop that image. Please try again.");
        }
    }, [rawImageBase64, croppedAreaPixels, color, emitChange, tempOriginalImageBase64]);

    const cancelCrop = useCallback(() => {
        setIsCropping(false);
        setRawImageBase64(null);
        setCroppedAreaPixels(null);
        setZoom(tempZoom);
        setCrop(tempCrop);
    }, [tempZoom, tempCrop]);

    const save = useCallback(async () => {
        setLoading(true);
        const request = {
            color,
            imageBase64, // cropped
            originalImageBase64, // raw/original
            zoom,
            cropx: crop.x,
            cropy: crop.y
        };

        const response = await fetch("/api/settings/savePreferences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(request),
        });

        setLoading(false);

        if (!response.ok) {
            if (response.status === 401) {
                navigate('/login', { state: { rtnPage: '/preferences' } });
            } else {
                const text = await response.text();
                throw new Error(`Failed to save preferences: ${text}`);
            }
        }
    }, [color, imageBase64, zoom, crop, originalImageBase64, navigate]);

    if (loading) return <MainLoading />;

    return (
        <div className={styles.preferences}>
            <div className={styles.header}>
                <div className={styles.title}>Preferences</div>
                <div className={styles.subtitle}>Pick a highlight color and upload an image.</div>
            </div>

            <div className={styles.grid}>
                {/* IMAGE CARD */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Photo Upload</div>

                    <div className={styles.uploadRow}>
                        <label className={styles.uploadButton}>
                            Choose Image
                            <input
                                ref={fileInputRef}
                                className={styles.hiddenInput}
                                type="file"
                                accept="image/*"
                                onChange={
                                    (e) => {
                                        handleFileSelected(e.target.files?.[0] ?? null);
                                        e.target.value = "";
                                    }
                                }
                            />
                        </label>

                        {/* Crop button: hidden while cropping */}
                        {!isCropping && (originalImageBase64 || imageBase64) && (
                            <button type="button" className={styles.secondaryButton} onClick={startCropExisting}>
                                Crop Image
                            </button>
                        )}

                        <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={clearImage}
                            disabled={!imageBase64 && !originalImageBase64 && !isCropping}
                        >
                            Clear
                        </button>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    {/* Cropper */}
                    {isCropping && rawImageBase64 ? (
                        <div className={styles.cropperShell}>
                            <div className={styles.cropperArea}>
                                <Cropper
                                    image={rawImageBase64}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>

                            <div className={styles.cropControls}>
                                <div className={styles.zoomRow}>
                                    <div className={styles.zoomLabel}>Zoom</div>
                                    <input
                                        className={styles.zoomSlider}
                                        type="range"
                                        min={1}
                                        max={5}
                                        step={0.01}
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                    />
                                </div>

                                <div className={styles.cropBtnRow}>
                                    <button type="button" className={styles.secondaryButton} onClick={cancelCrop}>
                                        Cancel
                                    </button>
                                    <button type="button" className={styles.primaryButton} onClick={applyCrop}>
                                        Use This
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.previewBox}>
                            {previewSrc ? (
                                <div className={styles.avatarPreviewRing}>
                                    <img className={styles.avatarPreview} src={previewSrc} alt="Avatar preview" />
                                </div>
                            ) : (
                                <div className={styles.previewPlaceholder}>No image selected</div>
                            )}
                        </div>
                    )}
                </div>

                {/* COLOR CARD */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Color Picker</div>

                    <div className={styles.pickerWrap}>
                        <HexColorPicker color={color} onChange={onColorChange} />
                    </div>

                    <div className={styles.colorRow}>
                        <div className={styles.swatch} style={{ background: color }} />
                        <div className={styles.colorText}>
                            <div className={styles.metaLabel}>Selected</div>
                            <div className={styles.colorValue}>{color.toUpperCase()}</div>
                        </div>
                    </div>

                    <div className={styles.hint}>Tip: Use this as your grid accent (name background).</div>
                </div>
            </div>

            <button onClick={save} className={styles.saveBtn} disabled={loading}>
                <span>Save</span>
            </button>
        </div>
    );
}

/**
 * Crops the given image and returns a base64 PNG.
 * If outputSize is provided, the result is resized to outputSize x outputSize.
 */
async function getCroppedImageBase64(imageSrc: string, crop: Area, outputSize?: number): Promise<string> {
    const img = await loadImage(imageSrc);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");

    const targetW = outputSize ?? Math.round(crop.width);
    const targetH = outputSize ?? Math.round(crop.height);

    canvas.width = targetW;
    canvas.height = targetH;

    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, targetW, targetH);

    return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
