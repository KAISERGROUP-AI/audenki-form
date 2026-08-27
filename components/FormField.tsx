import { useRef, useState } from "react";
import { FieldConfig } from "@/lib/formSections";
import { RequiredBadge } from "./RequiredBadge";

interface Props {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const baseInputClasses =
  "w-full rounded-lg border bg-white px-4 py-3.5 text-base text-ink placeholder:text-muted/60 " +
  "transition-colors duration-150 focus:outline-none focus:ring-4 " +
  "focus:ring-accent/15 focus:border-accent";

// 写真をそのまま base64 にすると容量が大きくメール添付に失敗しやすいため、
// 一度キャンバスに描画して長辺1600pxまで縮小・JPEG圧縮してから使います。
function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("読み込みに失敗しました。"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
      img.onload = () => {
        const maxSize = 1600;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("画像の変換に失敗しました。"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function FormField({ field, value, onChange, error }: Props) {
  const borderClass = error ? "border-red-400" : "border-line";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    setCompressing(true);
    try {
      const compressed = await compressImageFile(file);
      onChange(compressed);
    } catch {
      setFileError("写真の読み込みに失敗しました。もう一度お試しください。");
    } finally {
      setCompressing(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-bold text-ink">{field.label}</label>
        <RequiredBadge required={field.required} />
      </div>

      {field.type === "select" || field.type === "time-select" ? (
        <select
          className={`${baseInputClasses} ${borderClass} select-caret`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{field.placeholder ?? "選択してください"}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === "file" ? (
        <div className="flex flex-col gap-3">
          {value && (
            <img
              src={value}
              alt="同意書プレビュー"
              className="max-h-64 w-full rounded-lg border border-line object-contain"
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing}
            className={`${baseInputClasses} ${borderClass} text-center font-bold text-accent disabled:opacity-60`}
          >
            {compressing ? "処理中…" : value ? "写真を撮り直す" : "写真を撮影／選択する"}
          </button>
          {fileError && <p className="text-xs font-medium text-red-500">{fileError}</p>}
        </div>
      ) : (
        <input
          type={field.type === "date" ? "date" : field.type === "tel" ? "tel" : "text"}
          className={`${baseInputClasses} ${borderClass}`}
          placeholder={field.placeholder}
          value={value}
          autoComplete={field.autoComplete}
          inputMode={field.inputMode}
          maxLength={field.maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.helpText && <p className="text-xs text-muted">{field.helpText}</p>}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
