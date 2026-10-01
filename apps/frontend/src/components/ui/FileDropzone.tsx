import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

interface FileDropzoneProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  error?: string;
  label?: string;
}

export const FileDropzone = ({
  onFileSelect,
  accept = '.pdf',
  maxSizeMB = 50,
  error,
  label = 'Tải lên tài liệu',
}: FileDropzoneProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setLocalError(null);

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = accept.split(',').map((e) => e.trim().toLowerCase());
    if (accept !== '*' && !acceptedExtensions.includes(extension)) {
      setLocalError(`Định dạng tệp không hợp lệ. Chỉ chấp nhận tệp: ${accept}`);
      return false;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Tệp vượt quá giới hạn tối đa ${maxSizeMB}MB.`);
      return false;
    }

    return true;
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const removeFile = (e: any) => {
    e.stopPropagation();
    setSelectedFile(null);
    onFileSelect(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}

      <div
        className={`dropzone ${dragActive ? 'dropzone-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          accept={accept}
          onChange={handleChange}
        />

        {selectedFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', width: '100%', justifyContent: 'center' }}>
            <FileText size={32} style={{ color: 'var(--color-primary-600)' }} />
            <div style={{ textAlign: 'left', overflow: 'hidden', maxWidth: '70%' }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-slate-800)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {selectedFile.name}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: 0 }}>
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button onClick={removeFile} className="icon-btn" style={{ marginLeft: 'var(--spacing-2)' }} aria-label="Xóa tệp">
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud size={40} style={{ color: 'var(--color-slate-400)' }} />
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-slate-600)' }}>
              Kéo thả tệp vào đây hoặc click để duyệt tìm
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>
              Chấp nhận định dạng {accept} (tối đa {maxSizeMB}MB)
            </p>
          </>
        )}
      </div>
      {(error || localError) && (
        <span className="form-error-text" style={{ marginTop: '4px' }}>
          {error || localError}
        </span>
      )}
    </div>
  );
};
